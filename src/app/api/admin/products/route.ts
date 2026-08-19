import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { dbGetAllProducts, dbCreateProduct } from "@/lib/db/products";
import { Product } from "@/types/product";

function requireDb() {
  if (!isDbConfigured()) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local and run `npm run seed` to enable the admin dashboard."
    );
  }
}

export async function GET() {
  try {
    requireDb();
    const products = await dbGetAllProducts();
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireDb();
    const body = (await req.json()) as Partial<Product>;

    if (!body.name?.en || !body.slug || !body.price) {
      return NextResponse.json(
        { error: "name, slug and price are required." },
        { status: 400 }
      );
    }

    const product: Product = {
      id: crypto.randomUUID(),
      slug: body.slug,
      sku: body.sku || `ARC-${Date.now()}`,
      name: body.name,
      category: body.category || "",
      shortDescription: body.shortDescription || { en: "", ur: "" },
      description: body.description || { en: "", ur: "" },
      features: body.features || [],
      price: body.price,
      compareAtPrice: body.compareAtPrice,
      images: body.images || [],
      sizes: body.sizes || [],
      colors: body.colors || [],
      stock: body.stock ?? 0,
      rating: 0,
      reviewCount: 0,
      reviews: [],
      isFeatured: body.isFeatured ?? false,
      createdAt: new Date().toISOString(),
    };

    await dbCreateProduct(product);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
