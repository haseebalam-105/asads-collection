import { NextRequest, NextResponse } from "next/server";
import { dbUpdateReviewStatus, dbDeleteReview } from "@/lib/db/products";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string; reviewId: string } }
) {
  try {
    const { approved } = await req.json();
    await dbUpdateReviewStatus(params.productId, params.reviewId, approved);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string; reviewId: string } }
) {
  try {
    await dbDeleteReview(params.productId, params.reviewId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
