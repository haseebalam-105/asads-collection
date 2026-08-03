import { getDb } from "@/lib/db";
import { BlogPost } from "@/types/product";

const COLLECTION = "blog_posts";

export async function dbGetAllBlogPosts(publishedOnly = false): Promise<BlogPost[]> {
  const db = await getDb();
  const query = publishedOnly ? { published: true } : {};
  return db
    .collection<BlogPost>(COLLECTION)
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray() as Promise<BlogPost[]>;
}

export async function dbGetBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const db = await getDb();
  return db
    .collection<BlogPost>(COLLECTION)
    .findOne({ slug }, { projection: { _id: 0 } }) as Promise<BlogPost | null>;
}

export async function dbGetBlogPostById(id: string): Promise<BlogPost | null> {
  const db = await getDb();
  return db
    .collection<BlogPost>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } }) as Promise<BlogPost | null>;
}

export async function dbCreateBlogPost(post: BlogPost): Promise<BlogPost> {
  const db = await getDb();
  await db.collection<BlogPost>(COLLECTION).insertOne(post as any);
  return post;
}

export async function dbUpdateBlogPost(
  id: string,
  updates: Partial<BlogPost>
): Promise<BlogPost | null> {
  const db = await getDb();
  await db.collection<BlogPost>(COLLECTION).updateOne({ id }, { $set: updates });
  return dbGetBlogPostById(id);
}

export async function dbDeleteBlogPost(id: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id });
}
