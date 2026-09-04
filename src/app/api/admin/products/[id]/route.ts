import { NextRequest, NextResponse } from "next/server";
import { dbGetProductById, dbUpdateProduct, dbDeleteProduct } from "@/lib/db/products";
import { dbGetCategoryById } from "@/lib/db/categories";
import { Product } from "@/types/product";
import { validateProductPayload } from "@/lib/product-validation";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const updates = (await req.json()) as Partial<Product>;
    delete updates.id;
    delete updates.createdAt;

    // Shared validation — same rules as POST. Merge with the existing
    // product so partial updates (e.g. only changing `price`) still get
    // validated against the full product shape where it matters.
    const existing = await dbGetProductById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const merged: Partial<Product> = {
      ...existing,
      ...updates,
      // Merge variant arrays instead of replacing the whole object —
      // but if `variants` is explicitly provided, use the new value.
      variants: updates.variants ?? existing.variants,
      name: updates.name ?? existing.name,
      images: updates.images ?? existing.images,
    };
    const validationError = validateProductPayload(merged);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Validate category if specified.
    if (updates.categoryId) {
      const category = await dbGetCategoryById(updates.categoryId);
      if (!category) {
        return NextResponse.json(
          { error: "Selected category no longer exists." },
          { status: 400 }
        );
      }
      updates.category = category.slug;
    }

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
