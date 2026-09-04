import { getDb } from "@/lib/db";
import { Product } from "@/types/product";

const COLLECTION = "products";

/** Ensure unique slug + id indexes exist. Safe to call repeatedly. */
export async function ensureProductIndexes() {
  const db = await getDb();
  await db.collection(COLLECTION).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTION).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTION).createIndex({ categoryId: 1 });
}

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
  await ensureProductIndexes();
  const db = await getDb();
  try {
    await db.collection<Product>(COLLECTION).insertOne(product as any);
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error(
        "A product with this slug already exists. Please choose a different name or slug."
      );
    }
    throw err;
  }
  return product;
}

export async function dbUpdateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const db = await getDb();
  try {
    await db.collection<Product>(COLLECTION).updateOne({ id }, { $set: updates });
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error(
        "Another product already uses this slug. Please choose a different name or slug."
      );
    }
    throw err;
  }
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
  // Recompute the aggregate rating so product cards / SEO stay accurate
  // after a new review is added. We read back the product, compute the
  // mean of ALL reviews (approved + pending — the rating reflects total
  // feedback; the storefront only displays approved ones, but the
  // aggregate rating includes everything to avoid it dropping when a
  // review is pending).
  await recomputeProductRating(productId);
}

/**
 * Recalculate `product.rating` and `product.reviewCount` from the actual
 * reviews array. Called after any review insert/update/delete so the
 * aggregate fields never drift. Uses approved-only count for reviewCount
 * (since that's what's displayed publicly), but the rating is the mean of
 * approved reviews.
 */
export async function recomputeProductRating(productId: string): Promise<void> {
  const db = await getDb();
  const product = await db.collection<Product>(COLLECTION).findOne({ id: productId });
  if (!product) return;
  const approved = (product.reviews || []).filter((r) => r.approved);
  const reviewCount = approved.length;
  const rating = reviewCount > 0
    ? approved.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
    : 0;
  await db.collection<Product>(COLLECTION).updateOne(
    { id: productId },
    { $set: { rating: Math.round(rating * 10) / 10, reviewCount } }
  );
}

/**
 * Check whether a customer (by phone) has actually placed a delivered/
 * confirmed order containing this product. Used to set verifiedPurchase
 * on reviews — never returns true blindly.
 */
export async function dbCheckVerifiedPurchase(
  productId: string,
  customerPhone?: string,
  customerEmail?: string
): Promise<boolean> {
  if (!customerPhone && !customerEmail) return false;
  const db = await getDb();
  const query: Record<string, unknown> = {
    "items.productId": productId,
    status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
  };
  if (customerPhone) {
    query["customer.phone"] = customerPhone;
  } else if (customerEmail) {
    query["customer.email"] = customerEmail;
  }
  const count = await db.collection("orders").countDocuments(query);
  return count > 0;
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
      { $set: { "reviews.$.approved": approved, "reviews.$.updatedAt": new Date().toISOString() } }
    );
  // Recompute aggregate rating since approved count changed.
  await recomputeProductRating(productId);
}

export async function dbDeleteReview(productId: string, reviewId: string): Promise<void> {
  const db = await getDb();
  await db
    .collection(COLLECTION)
    .updateOne({ id: productId }, { $pull: { reviews: { id: reviewId } } as any });
  // Recompute aggregate rating since a review was removed.
  await recomputeProductRating(productId);
}

/**
 * Atomically decrement stock for a SIMPLE (non-variant) product.
 *
 * Uses a conditional update so the operation only succeeds if enough stock
 * remains. This prevents overselling under concurrent checkout races: if
 * two customers both see stock=1 and both submit quantity=1, only the
 * first update matches the filter and succeeds; the second finds stock
 * already at 0 and modifies 0 documents.
 *
 * Returns true if stock was decremented, false if insufficient stock.
 */
export async function dbDecrementProductStock(
  productId: string,
  quantity: number
): Promise<boolean> {
  const db = await getDb();
  const res = await db.collection<Product>(COLLECTION).updateOne(
    { id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } }
  );
  return res.modifiedCount === 1;
}

/**
 * Atomically decrement stock for a SPECIFIC VARIANT of a product.
 *
 * Uses `$elemMatch` so that `id`, `active`, AND `stock >= quantity` must
 * all be satisfied by the SAME variant array element. Without `$elemMatch`,
 * MongoDB could match `variants.id` on one element and `variants.stock`
 * on a different element — letting Variant A's stock be decremented based
 * on Variant B's stock level. The `$elemMatch` guarantees:
 *
 *   - exact requested product (id)
 *   - exact requested variant (variants.id)
 *   - variant is active (variants.active === true)
 *   - exact variant has stock >= quantity (variants.stock)
 *   - only that exact variant stock is decremented (`variants.$.stock`)
 *
 * The positional `$` operator targets the array element matched by the
 * `$elemMatch`, so no other variant is touched.
 *
 * Returns true if stock was decremented, false if insufficient stock,
 * variant inactive, or variant not found.
 */
export async function dbDecrementVariantStock(
  productId: string,
  variantId: string,
  quantity: number
): Promise<boolean> {
  const db = await getDb();
  const res = await db.collection<Product>(COLLECTION).updateOne(
    {
      id: productId,
      variants: {
        $elemMatch: {
          id: variantId,
          active: true,
          stock: { $gte: quantity },
        },
      },
    },
    { $inc: { "variants.$.stock": -quantity } }
  );
  return res.modifiedCount === 1;
}

/**
 * Restore stock for a simple product — used to compensate when an order
 * is cancelled after stock was already decremented. Not used in the
 * normal checkout path.
 */
export async function dbIncrementProductStock(
  productId: string,
  quantity: number
): Promise<void> {
  const db = await getDb();
  await db.collection<Product>(COLLECTION).updateOne(
    { id: productId },
    { $inc: { stock: quantity } }
  );
}

/**
 * Restore stock for a specific variant.
 */
export async function dbIncrementVariantStock(
  productId: string,
  variantId: string,
  quantity: number
): Promise<void> {
  const db = await getDb();
  await db.collection<Product>(COLLECTION).updateOne(
    { id: productId, "variants.id": variantId },
    { $inc: { "variants.$.stock": quantity } }
  );
}
