import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { dbGetAllProducts, dbCreateProduct } from "@/lib/db/products";
import { dbGetCategoryById, dbGetAllCategories } from "@/lib/db/categories";
import { Product } from "@/types/product";
import { slugify } from "@/lib/variants";
import { validateProductPayload } from "@/lib/product-validation";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Shared validation — same rules as PUT.
    const validationError = validateProductPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Validate category if specified.
    if (body.categoryId) {
      const category = await dbGetCategoryById(body.categoryId);
      if (!category) {
        return NextResponse.json(
          { error: "Selected category no longer exists. Please choose another." },
          { status: 400 }
        );
      }
      // Auto-sync the legacy category slug from the selected category.
      body.category = category.slug;
    } else if (body.category) {
      // If only the legacy slug is provided (e.g. legacy product), try to
      // backfill the categoryId from the existing category list.
      const allCategories = await dbGetAllCategories();
      const match = allCategories.find((c) => c.slug === body.category);
      if (match) body.categoryId = match.id;
    }

    const product: Product = {
      id: crypto.randomUUID(),
      slug: body.slug || slugify(body.name?.en || ""),
      sku: body.sku || `ARC-${Date.now()}`,
      name: body.name!,
      category: body.category || "",
      categoryId: body.categoryId,
      shortDescription: body.shortDescription || { en: "", ur: "" },
      description: body.description || { en: "", ur: "" },
      features: body.features || [],
      price: body.price!,
      compareAtPrice: body.compareAtPrice,
      images: body.images || [],
      sizes: body.sizes || [],
      colors: body.colors || [],
      variants: body.variants || [],
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
