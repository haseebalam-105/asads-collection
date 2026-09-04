import { Category, Product } from "@/types/product";
import { isDbConfigured } from "@/lib/db";
import {
  products as staticProducts,
  categories as staticCategories,
} from "@/lib/products";
import { dbGetAllProducts, dbGetProductBySlug } from "@/lib/db/products";
import { dbGetActiveCategories, dbGetAllCategories } from "@/lib/db/categories";

export { categories as staticCategories } from "@/lib/products";

/**
 * Single source of truth for storefront product data. Uses MongoDB when
 * MONGODB_URI is configured (i.e. once you've run `npm run seed`), and
 * falls back to the static catalog in lib/products.ts otherwise — so the
 * storefront works out of the box, and switches to live, admin-editable
 * data the moment a database is connected.
 */
export async function getAllProductsAsync(): Promise<Product[]> {
  if (isDbConfigured()) {
    try {
      return await dbGetAllProducts();
    } catch {
      return staticProducts;
    }
  }
  return staticProducts;
}

export async function getFeaturedProductsAsync(): Promise<Product[]> {
  const all = await getAllProductsAsync();
  return all.filter((p) => p.isFeatured);
}

export async function getProductBySlugAsync(slug: string): Promise<Product | undefined> {
  if (isDbConfigured()) {
    try {
      const product = await dbGetProductBySlug(slug);
      if (product) return product;
    } catch {
      // fall through to static
    }
  }
  return staticProducts.find((p) => p.slug === slug);
}

export async function getRelatedProductsAsync(slug: string, limit = 4): Promise<Product[]> {
  const all = await getAllProductsAsync();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  return all
    .filter((p) => p.slug !== slug && p.category === current.category)
    .concat(all.filter((p) => p.slug !== slug && p.category !== current.category))
    .slice(0, limit);
}

/**
 * Dynamic categories: uses MongoDB `categories` collection when configured,
 * falls back to the static list in lib/products.ts otherwise. Admin-created
 * categories appear here immediately without a redeploy.
 *
 * Pass `includeInactive: true` for admin views; storefront uses the default
 * (active-only) so customers never see hidden categories.
 */
export async function getAllCategoriesAsync(
  options: { includeInactive?: boolean } = {}
): Promise<Category[]> {
  if (isDbConfigured()) {
    try {
      const cats = options.includeInactive
        ? await dbGetAllCategories()
        : await dbGetActiveCategories();
      if (cats.length > 0) return cats;
      // If DB is configured but empty, fall through to static so the
      // storefront still renders before the admin has created any
      // categories.
    } catch {
      // fall through to static
    }
  }
  return staticCategories.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
}
