import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import {
  dbGetAllCategories,
  dbCreateCategory,
  dbCountProductsByCategory,
} from "@/lib/db/categories";
import { Category } from "@/types/product";
import { slugify } from "@/lib/variants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function requireDb() {
  if (!isDbConfigured()) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local and run `npm run seed` to enable categories."
    );
  }
}

export async function GET() {
  try {
    requireDb();
    const categories = await dbGetAllCategories();
    // Attach product counts so the admin table can show them without a
    // second round-trip per row.
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        ...c,
        productCount: await dbCountProductsByCategory(c.id, c.slug),
      }))
    );
    return NextResponse.json({ categories: withCounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireDb();
    const body = (await req.json()) as Partial<Category> & {
      nameEn?: string;
      nameUr?: string;
      descEn?: string;
      descUr?: string;
    };

    const nameEn = (body.nameEn || body.name?.en || "").trim();
    const nameUr = (body.nameUr || body.name?.ur || "").trim();
    if (!nameEn) {
      return NextResponse.json({ error: "Category name (English) is required." }, { status: 400 });
    }

    const slug = (body.slug && body.slug.trim()) || slugify(nameEn);
    if (!slug) {
      return NextResponse.json({ error: "Could not generate a valid slug." }, { status: 400 });
    }

    const descEn = (body.descEn || body.description?.en || "").trim();
    const descUr = (body.descUr || body.description?.ur || "").trim();

    const category: Category = {
      id: crypto.randomUUID(),
      name: { en: nameEn, ur: nameUr || nameEn },
      slug,
      description:
        descEn || descUr
          ? { en: descEn, ur: descUr || descEn }
          : undefined,
      image: body.image,
      active: body.active ?? true,
      createdAt: new Date().toISOString(),
    };

    await dbCreateCategory(category);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
