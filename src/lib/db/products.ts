import { getDb } from "@/lib/db";
import { Product } from "@/types/product";

const COLLECTION = "products";

export async function dbGetAllProducts(): Promise<Product[]> {
  const db = await getDb();
  const docs = await db
    .collection<Product>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as Product[];
}

export async function dbGetProductBySlug(slug: string): Promise<Product | null> {
  const db = await getDb();
  return db
    .collection<Product>(COLLECTION)
    .findOne({ slug }, { projection: { _id: 0 } }) as Promise<Product | null>;
}

export async function dbGetProductById(id: string): Promise<Product | null> {
  const db = await getDb();
  return db
    .collection<Product>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } }) as Promise<Product | null>;
}

export async function dbCreateProduct(product: Product): Promise<Product> {
  const db = await getDb();
  await db.collection<Product>(COLLECTION).insertOne(product as any);
  return product;
}

export async function dbUpdateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const db = await getDb();
  await db.collection<Product>(COLLECTION).updateOne({ id }, { $set: updates });
  return dbGetProductById(id);
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id });
}

export async function dbUpsertProductReview(
  productId: string,
  review: Product["reviews"][number]
): Promise<void> {
  const db = await getDb();
  await db.collection<Product>(COLLECTION).updateOne(
    { id: productId },
    {
      $push: { reviews: review } as any,
      $inc: { reviewCount: 1 } as any,
    }
  );
}

export async function dbUpdateReviewStatus(
  productId: string,
  reviewId: string,
  approved: boolean
): Promise<void> {
  const db = await getDb();
  await db
    .collection(COLLECTION)
    .updateOne(
      { id: productId, "reviews.id": reviewId },
      { $set: { "reviews.$.approved": approved } }
    );
}

export async function dbDeleteReview(productId: string, reviewId: string): Promise<void> {
  const db = await getDb();
  await db
    .collection(COLLECTION)
    .updateOne({ id: productId }, { $pull: { reviews: { id: reviewId } } as any });
}
