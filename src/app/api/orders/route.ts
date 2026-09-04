import { NextRequest, NextResponse } from "next/server";
import { CartItem, CustomerDetails, Order } from "@/types/product";
import { saveOrder, findOrder } from "@/lib/orders-store";
import { generateOrderNumber } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";
import { dbGetSettings } from "@/lib/db/settings";
import { dbGetProductBySlug } from "@/lib/db/products";
import {
  dbDecrementProductStock,
  dbDecrementVariantStock,
  dbIncrementProductStock,
  dbIncrementVariantStock,
} from "@/lib/db/products";
import { isDbConfigured } from "@/lib/db";
import { sendMetaEvent } from "@/lib/meta-capi";
import { resolveOrderLine } from "@/lib/variants";

// Prevent Next.js from statically caching this route.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/orders — place a new order (guest checkout, COD only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer, couponCode } = body as {
      items: CartItem[];
      customer: CustomerDetails;
      couponCode?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }
    const required: (keyof CustomerDetails)[] = ["fullName", "phone", "city", "address"];
    for (const field of required) {
      if (!customer?.[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // SERVER-SIDE PRICE/STOCK VALIDATION (CRITICAL — never trust the client)
    // ============================================================
    //
    // For every cart line, we:
    //   1. Look up the product from MongoDB by slug.
    //   2. Use resolveOrderLine() to enforce ALL security rules:
    //      - variantId required for variant products (no fallback to product.price)
    //      - variant exists on this exact product
    //      - variant is active
    //      - variant stock > 0 (zero-stock rejected)
    //      - quantity <= stock
    //   3. Overwrite the client-supplied price/image/sku/label/options
    //      with the server-resolved values so a tampered cart cannot
    //      change what gets persisted to the order.
    //
    // In dev mode (no DB configured), client values are accepted as-is
    // so the checkout flow still works end-to-end without MongoDB.
    const DEV_MODE = !isDbConfigured();
    const authoritativeItems: CartItem[] = [];
    // Track what stock to decrement AFTER the order is saved. We do the
    // decrement after save so a failed save doesn't leave us with
    // decremented stock but no order. If the decrement then fails (race
    // condition — another customer grabbed the last unit first), we
    // delete the order and return a failure.
    const stockOps: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      // Basic quantity sanity check.
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: "Invalid quantity in cart." },
          { status: 400 }
        );
      }

      if (DEV_MODE) {
        authoritativeItems.push(item);
        continue;
      }

      const product = await dbGetProductBySlug(item.slug);
      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.slug}" is no longer available.` },
          { status: 400 }
        );
      }
      try {
        const resolved = resolveOrderLine(product, item.variantId, item.quantity);
        authoritativeItems.push({
          ...item,
          price: resolved.price,
          image: resolved.image,
          variantSku: resolved.sku,
          variantLabel: resolved.variantLabel || item.variantLabel,
          selectedOptions: resolved.selectedOptions,
          variantId: resolved.variant?.id || item.variantId,
        });
        stockOps.push({
          productId: product.id,
          variantId: resolved.variant?.id,
          quantity: item.quantity,
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || "Could not validate product price." },
          { status: 400 }
        );
      }
    }

    // Subtotal is always recomputed server-side from the authoritative
    // prices — never from client-supplied numbers.
    const subtotal = authoritativeItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const liveSettings = DEV_MODE ? undefined : await dbGetSettings();
    const deliveryFee = getDeliveryFee(subtotal, liveSettings);

    // Discount is always recomputed server-side from the coupon code —
    // never trust a client-supplied discount amount.
    let discount = 0;
    if (couponCode && !DEV_MODE) {
      try {
        const { dbGetActiveCouponByCode } = await import("@/lib/db/coupons");
        const coupon = await dbGetActiveCouponByCode(couponCode);
        if (coupon && subtotal >= coupon.minOrderValue) {
          discount =
            coupon.type === "percentage"
              ? Math.round((subtotal * coupon.value) / 100)
              : Math.min(coupon.value, subtotal);
        }
      } catch {
        discount = 0;
      }
    }

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(),
      items: authoritativeItems,
      customer,
      subtotal,
      deliveryFee,
      discount: discount || undefined,
      couponCode: discount ? couponCode : undefined,
      total: subtotal + deliveryFee - discount,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      status: "new",
      createdAt: new Date().toISOString(),
    };

    // ----- Persist the order (no silent fallback in production) -----
    try {
      await saveOrder(order);
    } catch (saveErr: any) {
      console.error("[/api/orders] Order persistence failed:", saveErr);
      return NextResponse.json(
        { error: "We could not place your order due to a server issue. Please try again." },
        { status: 503 }
      );
    }

    // ----- Atomic stock decrement (overselling protection) -----
    // After the order is persisted, decrement stock atomically. If any
    // decrement fails (race condition — another customer grabbed the
    // last unit between our validation and now), we roll back the
    // already-applied decrements and delete the order, then return a
    // failure so the customer knows to retry.
    if (!DEV_MODE && stockOps.length > 0) {
      const applied: Array<{ productId: string; variantId?: string; quantity: number }> = [];
      let conflict = false;
      for (const op of stockOps) {
        const ok = op.variantId
          ? await dbDecrementVariantStock(op.productId, op.variantId, op.quantity)
          : await dbDecrementProductStock(op.productId, op.quantity);
        if (!ok) {
          conflict = true;
          break;
        }
        applied.push(op);
      }
      if (conflict) {
        // Roll back the decrements that did succeed.
        for (const op of applied) {
          try {
            if (op.variantId) {
              await dbIncrementVariantStock(op.productId, op.variantId, op.quantity);
            } else {
              await dbIncrementProductStock(op.productId, op.quantity);
            }
          } catch (rollbackErr) {
            // Best-effort rollback — log it so an admin can reconcile.
            console.error(
              `[/api/orders] STOCK ROLLBACK FAILED for product ${op.productId}` +
                (op.variantId ? ` variant ${op.variantId}` : "") +
                ` qty ${op.quantity}:`,
              rollbackErr
            );
          }
        }
        // Delete the order so the customer isn't charged for stock we
        // couldn't allocate.
        try {
          const { dbDeleteOrder } = await import("@/lib/db/orders");
          await dbDeleteOrder(order.id);
        } catch (delErr) {
          console.error("[/api/orders] Failed to delete order after stock conflict:", delErr);
        }
        return NextResponse.json(
          {
            error:
              "Sorry — one of the items in your cart just sold out. Please refresh your cart and try again.",
          },
          { status: 409 }
        );
      }
    }

    try {
      const { sendOrderConfirmationEmail } = await import("@/lib/mail");
      await sendOrderConfirmationEmail(order);
    } catch {
      // Email sending is optional until SMTP creds are set — never block
      // the order from being placed if it fails.
    }

    // Meta Purchase event — fired server-side so it's tracked reliably even
    // if the customer's browser blocks the Pixel, closes the tab before the
    // confirmation page loads, or has tracking prevention enabled. order.id
    // is reused as the event_id so the browser-side Purchase fired on the
    // confirmation page (same id) gets deduplicated by Meta into one event.
    try {
      if (!DEV_MODE) {
        const settings = liveSettings || (await dbGetSettings());
        const ip =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          undefined;
        const userAgent = req.headers.get("user-agent") || undefined;

        await sendMetaEvent({
          pixelId: settings.metaPixelId,
          accessToken: settings.metaAccessToken,
          testEventCode: settings.metaTestEventCode || undefined,
          eventName: "Purchase",
          eventId: order.id,
          eventSourceUrl: req.headers.get("referer") || undefined,
          userData: {
            email: customer.email,
            phone: customer.phone,
            firstName: customer.fullName?.split(" ")[0],
            city: customer.city,
            ip,
            userAgent,
          },
          customData: {
            currency: "PKR",
            value: order.total,
            content_ids: authoritativeItems.map((i) => i.productId),
            content_type: "product",
            contents: authoritativeItems.map((i) => ({
              id: i.productId,
              quantity: i.quantity,
              item_price: i.price,
            })),
            num_items: authoritativeItems.reduce((sum, i) => sum + i.quantity, 0),
            order_id: order.orderNumber,
          },
        });
      }
    } catch {
      // Ad-tracking failures should never block or fail an actual order.
    }

    return NextResponse.json({ order, metaEventId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[/api/orders] Unhandled error:", err);
    return NextResponse.json({ error: "Could not place order." }, { status: 500 });
  }
}

// GET /api/orders?orderNumber=AC-...&phone=03xx — track an order
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: "orderNumber and phone are required." },
      { status: 400 }
    );
  }

  const order = await findOrder(orderNumber, phone);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
