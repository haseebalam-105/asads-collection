import { NextRequest, NextResponse } from "next/server";
import { dbGetCoupons, dbCreateCoupon } from "@/lib/db/coupons";
import { Coupon } from "@/types/product";

export async function GET() {
  try {
    const coupons = await dbGetCoupons();
    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code || !body.type || !body.value) {
      return NextResponse.json(
        { error: "code, type and value are required." },
        { status: 400 }
      );
    }
    const coupon: Coupon = {
      id: crypto.randomUUID(),
      code: body.code.toUpperCase(),
      type: body.type,
      value: Number(body.value),
      minOrderValue: Number(body.minOrderValue) || 0,
      expiresAt: body.expiresAt || null,
      active: body.active ?? true,
      createdAt: new Date().toISOString(),
    };
    await dbCreateCoupon(coupon);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
