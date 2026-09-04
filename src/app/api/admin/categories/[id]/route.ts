import { NextRequest, NextResponse } from "next/server";
import {
  dbGetCategoryById,
  dbUpdateCategory,
  dbDeleteCategory,
  dbCountProductsByCategory,
  dbReassignProductsCategory,
  dbSyncLegacyCategorySlug,
} from "@/lib/db/categories";
import { slugify } from "@/lib/variants";
import { Category } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const category = await dbGetCategoryById(params.id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as Partial<Category> & {
      nameEn?: string;
      nameUr?: string;
      descEn?: string;
      descUr?: string;
      reassignTo?: string; // for safe delete
    };

    // Fetch the existing category so we can detect slug changes and
    // sync the legacy `category` field on affected products.
    const existing = await dbGetCategoryById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Partial<Category> = {};

    const nameEn = (body.nameEn || body.name?.en || "").trim();
    const nameUr = (body.nameUr || body.name?.ur || "").trim();
    if (nameEn) updates.name = { en: nameEn, ur: nameUr || nameEn };

    let newSlug: string | undefined;
    if (body.slug !== undefined) {
      const slug = body.slug.trim() || slugify(nameEn);
      if (slug) {
        updates.slug = slug;
        newSlug = slug;
      }
    } else if (nameEn) {
      // Auto-regenerate slug from new name only if the admin didn't
      // explicitly provide one.
      const generated = slugify(nameEn);
      updates.slug = generated;
      newSlug = generated;
    }

    if (body.descEn !== undefined || body.descUr !== undefined) {
      const descEn = (body.descEn || "").trim();
      const descUr = (body.descUr || "").trim();
      updates.description = descEn || descUr ? { en: descEn, ur: descUr || descEn } : undefined;
    } else if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.image !== undefined) updates.image = body.image;
    if (body.active !== undefined) updates.active = body.active;

    const updated = await dbUpdateCategory(params.id, updates);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If the slug changed, sync the legacy `category` field on all
    // products that reference this category so storefront filters keep
    // working. The `categoryId` FK is the stable relationship and is NOT
    // changed — only the legacy string is updated to the new slug.
    if (newSlug && newSlug !== existing.slug) {
      try {
        await dbSyncLegacyCategorySlug(params.id, existing.slug, newSlug);
      } catch (syncErr) {
        // Don't fail the category update if the legacy sync fails —
        // the FK is still correct, this is just a convenience update.
        console.error("[/api/admin/categories PUT] legacy slug sync failed:", syncErr);
      }
    }

    return NextResponse.json({ category: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const reassignTo = url.searchParams.get("reassignTo"); // target category id

    // Fetch the category so we know its slug for the legacy-field check.
    const existing = await dbGetCategoryById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Count products that reference this category by EITHER the new FK
    // or the legacy slug — so legacy products aren't orphaned.
    const count = await dbCountProductsByCategory(params.id, existing.slug);
    if (count > 0) {
      if (!reassignTo) {
        // Option A: refuse to delete until the admin picks a target.
        return NextResponse.json(
          {
            error: `This category contains ${count} product(s). Choose another category to move them to before deleting, or remove the products first.`,
            code: "HAS_PRODUCTS",
            productCount: count,
          },
          { status: 409 }
        );
      }
      if (reassignTo === params.id) {
        return NextResponse.json(
          { error: "Choose a different category to move the products to." },
          { status: 400 }
        );
      }
      // Option B: move products to the target category, then delete.
      const target = await dbGetCategoryById(reassignTo);
      if (!target) {
        return NextResponse.json({ error: "Target category not found." }, { status: 404 });
      }
      const moved = await dbReassignProductsCategory(
        params.id,
        existing.slug,
        target.id,
        target.slug
      );
      await dbDeleteCategory(params.id);
      return NextResponse.json({ ok: true, movedProducts: moved });
    }

    await dbDeleteCategory(params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
