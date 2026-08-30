import { NextResponse } from "next/server";
import { dbGetAllProducts } from "@/lib/db/products";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


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
