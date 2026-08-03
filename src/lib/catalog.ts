import { Product } from "@/types/product";
import { isDbConfigured } from "@/lib/db";
import { products as staticProducts, categories } from "@/lib/products";
import { dbGetAllProducts, dbGetProductBySlug } from "@/lib/db/products";

export { categories };

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
