import { NextRequest, NextResponse } from "next/server";
import { dbGetProductById, dbUpdateProduct, dbDeleteProduct } from "@/lib/db/products";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await dbGetProductById(params.id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    delete updates.id;
    delete updates.createdAt;
    const product = await dbUpdateProduct(params.id, updates);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbDeleteProduct(params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
