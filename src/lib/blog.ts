import { BlogPost } from "@/types/product";
import { isDbConfigured } from "@/lib/db";
import { dbGetAllBlogPosts, dbGetBlogPostBySlug } from "@/lib/db/blog";

/**
 * Blog has no static fallback data (unlike products) since it's a purely
 * admin-authored content type — it simply returns an empty list until a
 * database is connected and posts are published from /admin/blog.
 */
export async function getPublishedBlogPostsAsync(): Promise<BlogPost[]> {
  if (!isDbConfigured()) return [];
  try {
    return await dbGetAllBlogPosts(true);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlugAsync(slug: string): Promise<BlogPost | null> {
  if (!isDbConfigured()) return null;
  try {
    const post = await dbGetBlogPostBySlug(slug);
    return post && post.published ? post : null;
  } catch {
    return null;
  }
}
