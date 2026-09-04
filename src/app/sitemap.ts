import { MetadataRoute } from "next";
import { getAllProductsAsync } from "@/lib/catalog";
import { getPublishedBlogPostsAsync } from "@/lib/blog";

/**
 * Dynamic sitemap — uses the same async/DB-aware product source as the
 * storefront (getAllProductsAsync). Products created from the admin
 * dashboard appear here immediately without source-code changes.
 *
 * Falls back to the static catalog in lib/products.ts when MongoDB is
 * not configured or unreachable, so the sitemap always renders.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://asad-collection.vercel.app";

  const staticRoutes = ["", "/shop", "/blog", "/about", "/contact", "/track-order"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    })
  );

  const products = await getAllProductsAsync();
  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(p.createdAt),
  }));

  const posts = await getPublishedBlogPostsAsync();
  const blogRoutes = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.createdAt),
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
