import { NextResponse } from "next/server";
import { dbGetAllProducts } from "@/lib/db/products";

export async function GET() {
  try {
    const products = await dbGetAllProducts();
    const reviews = products.flatMap((p) =>
      p.reviews.map((r) => ({
        ...r,
        productId: p.id,
        productName: p.name.en,
        productSlug: p.slug,
      }))
    );
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
