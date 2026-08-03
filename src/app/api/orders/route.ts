import { NextRequest, NextResponse } from "next/server";
import { CartItem, CustomerDetails, Order } from "@/types/product";
import { saveOrder, findOrder } from "@/lib/orders-store";
import { generateOrderNumber } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";
import { isDbConfigured } from "@/lib/db";

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
    const required: (keyof CustomerDetails)[] = ["fullName", "email", "phone", "city", "address"];
    for (const field of required) {
      if (!customer?.[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = getDeliveryFee(subtotal);

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

    return NextResponse.json({ order }, { status: 201 });
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
