import { getDb } from "@/lib/db";
import { Category } from "@/types/product";

const COLLECTION = "categories";

/** Ensure unique slug + id indexes exist. Safe to call repeatedly. */
export async function ensureCategoryIndexes() {
  const db = await getDb();
  await db.collection(COLLECTION).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTION).createIndex({ id: 1 }, { unique: true });
}

export async function dbGetAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const docs = await db
    .collection<Category>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return docs as Category[];
}

export async function dbGetActiveCategories(): Promise<Category[]> {
  const db = await getDb();
  const docs = await db
    .collection<Category>(COLLECTION)
    .find({ active: true }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return docs as Category[];
}

export async function dbGetCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();
  return db
    .collection<Category>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } }) as Promise<Category | null>;
}

export async function dbGetCategoryBySlug(slug: string): Promise<Category | null> {
  const db = await getDb();
  return db
    .collection<Category>(COLLECTION)
    .findOne({ slug }, { projection: { _id: 0 } }) as Promise<Category | null>;
}

export async function dbCreateCategory(category: Category): Promise<Category> {
  await ensureCategoryIndexes();
  const db = await getDb();
  try {
    await db.collection<Category>(COLLECTION).insertOne(category as any);
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error(
        "A category with this slug already exists. Please choose a different name or slug."
      );
    }
    throw err;
  }
  return category;
}

export async function dbUpdateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | null> {
  const db = await getDb();
  try {
    await db.collection<Category>(COLLECTION).updateOne(
      { id },
      {
        $set: { ...updates, updatedAt: new Date().toISOString() },
      }
    );
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error(
        "Another category already uses this slug. Please choose a different name or slug."
      );
    }
    throw err;
  }
  return dbGetCategoryById(id);
}

export async function dbDeleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id });
}

/** Count products assigned to a given category. Used by the admin Categories
 *  page to display product counts and to enforce safe deletion.
 *
 *  Counts BOTH the new `categoryId` FK AND the legacy `category` slug,
 *  so products that were created before the categoryId field existed
 *  (or that only have the legacy string) are still counted.
 *
 *  Pass the category's `id` AND its `slug` so both fields can be queried. */
export async function dbCountProductsByCategory(
  categoryId: string,
  categorySlug?: string
): Promise<number> {
  const db = await getDb();
  // Use $or so a product matches if it references the category by EITHER
  // the new FK or the legacy slug. This prevents orphaned products from
  // being missed during safe-deletion checks.
  const query: Record<string, unknown> = {
    $or: [{ categoryId }],
  };
  if (categorySlug) {
    (query.$or as unknown[]).push({ category: categorySlug });
  }
  return db.collection("products").countDocuments(query);
}

/** Reassign all products from one category to another. Used during safe
 *  category deletion (Option B in the spec).
 *
 *  Reassigns BOTH the `categoryId` FK AND the legacy `category` slug,
 *  so products referenced either way are moved to the target category. */
export async function dbReassignProductsCategory(
  fromCategoryId: string,
  fromCategorySlug: string | undefined,
  toCategoryId: string,
  toCategorySlug: string
): Promise<number> {
  const db = await getDb();
  // Match products that reference the source category by EITHER field.
  const query: Record<string, unknown> = {
    $or: [{ categoryId: fromCategoryId }],
  };
  if (fromCategorySlug) {
    (query.$or as unknown[]).push({ category: fromCategorySlug });
  }
  const res = await db
    .collection("products")
    .updateMany(query, {
      $set: { categoryId: toCategoryId, category: toCategorySlug },
    });
  return res.modifiedCount;
}

/**
 * Sync the legacy `category` slug on products when a category is renamed.
 *
 * When an admin renames a category (which changes its slug), products that
 * still reference the OLD slug via the legacy `category` field need to be
 * updated so storefront filters keep working. The `categoryId` FK remains
 * the stable relationship and is NOT changed — only the legacy field is
 * updated to the new slug.
 *
 * This function handles TWO populations of products:
 *
 *   1. Products with `categoryId === category.id` AND legacy `category === oldSlug`
 *      → update legacy `category` to `newSlug` (categoryId already correct).
 *
 *   2. LEGACY products with only `category === oldSlug` and NO `categoryId`
 *      (or a mismatched one) → update legacy `category` to `newSlug` AND
 *      backfill `categoryId` to `category.id`, so they're properly linked
 *      going forward.
 *
 * Without branch (2), old products that only have the legacy string would
 * keep pointing at a slug that no longer exists after the rename.
 *
 * Returns the total number of products updated.
 */
export async function dbSyncLegacyCategorySlug(
  categoryId: string,
  oldSlug: string,
  newSlug: string
): Promise<number> {
  if (oldSlug === newSlug) return 0;
  const db = await getDb();
  let total = 0;

  // (1) Products already linked via categoryId — just sync the legacy slug.
  const res1 = await db.collection("products").updateMany(
    { categoryId, category: oldSlug },
    { $set: { category: newSlug } }
  );
  total += res1.modifiedCount;

  // (2) Legacy products with ONLY the old slug (no categoryId, or a
  //     mismatched/null categoryId). Backfill BOTH the categoryId and
  //     the new slug so they're fully linked going forward. We exclude
  //     products already handled by branch (1) by requiring categoryId
  //     to be absent or different from this category.
  const res2 = await db.collection("products").updateMany(
    {
      category: oldSlug,
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null },
        { categoryId: { $ne: categoryId } },
      ],
    },
    { $set: { category: newSlug, categoryId } }
  );
  total += res2.modifiedCount;

  return total;
}

/** For legacy products that only have `category` (slug) but no `categoryId`,
 *  backfill the FK so they show up correctly in the new system. */
export async function dbBackfillProductCategoryIds(): Promise<number> {
  const db = await getDb();
  const categories = await dbGetAllCategories();
  let total = 0;
  for (const c of categories) {
    const res = await db
      .collection("products")
      .updateMany({ category: c.slug, categoryId: { $exists: false } }, { $set: { categoryId: c.id } });
    total += res.modifiedCount;
  }
  return total;
}
