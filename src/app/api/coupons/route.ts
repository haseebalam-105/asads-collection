import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { dbGetActiveCouponByCode } from "@/lib/db/coupons";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Coupons are not available yet." }, { status: 400 });
  }

  const { code, subtotal } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
  }

  const coupon = await dbGetActiveCouponByCode(code);
  if (!coupon) {
    return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });
  }
  if (subtotal < coupon.minOrderValue) {
    return NextResponse.json(
      { error: `This coupon requires a minimum order of Rs. ${coupon.minOrderValue}.` },
      { status: 400 }
    );
  }

  const discount =
    coupon.type === "percentage"
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return NextResponse.json({ coupon, discount });
}
