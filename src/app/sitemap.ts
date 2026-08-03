import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getPublishedBlogPostsAsync } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://asad-collection.vercel.app";

  const staticRoutes = ["", "/shop", "/blog", "/about", "/contact", "/track-order"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    })
  );

  const productRoutes = getAllProducts().map((p) => ({
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
