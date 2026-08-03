import { NextRequest, NextResponse } from "next/server";
import { dbUpdateCoupon, dbDeleteCoupon } from "@/lib/db/coupons";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    await dbUpdateCoupon(params.id, updates);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbDeleteCoupon(params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
