import { NextRequest, NextResponse } from "next/server";
import { CartItem, CustomerDetails, Order } from "@/types/product";
import { saveOrder, findOrder } from "@/lib/orders-store";
import { generateOrderNumber } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";
import { dbGetSettings } from "@/lib/db/settings";
import { isDbConfigured } from "@/lib/db";
import { sendMetaEvent } from "@/lib/meta-capi";

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

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const liveSettings = isDbConfigured() ? await dbGetSettings() : undefined;
    const deliveryFee = getDeliveryFee(subtotal, liveSettings);

    // Discount is always recomputed server-side from the coupon code —
    // never trust a client-supplied discount amount.
    let discount = 0;
    if (couponCode && isDbConfigured()) {
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
      items,
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

    await saveOrder(order);

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
      if (isDbConfigured()) {
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
            content_ids: items.map((i) => i.productId),
            content_type: "product",
            contents: items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.price })),
            num_items: items.reduce((sum, i) => sum + i.quantity, 0),
            order_id: order.orderNumber,
          },
        });
      }
    } catch {
      // Ad-tracking failures should never block or fail an actual order.
    }

    return NextResponse.json({ order, metaEventId: order.id }, { status: 201 });
  } catch (err) {
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
