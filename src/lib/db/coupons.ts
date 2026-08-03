import { getDb } from "@/lib/db";
import { Coupon } from "@/types/product";

const COLLECTION = "coupons";

export async function dbGetCoupons(): Promise<Coupon[]> {
  const db = await getDb();
  return db
    .collection<Coupon>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Coupon[]>;
}

export async function dbGetActiveCouponByCode(code: string): Promise<Coupon | null> {
  const db = await getDb();
  const coupon = await db
    .collection<Coupon>(COLLECTION)
    .findOne({ code: new RegExp(`^${code}$`, "i"), active: true }, { projection: { _id: 0 } });
  if (!coupon) return null;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null;
  return coupon as Coupon;
}

export async function dbCreateCoupon(coupon: Coupon): Promise<Coupon> {
  const db = await getDb();
  await db.collection<Coupon>(COLLECTION).insertOne(coupon as any);
  return coupon;
}

export async function dbUpdateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne({ id }, { $set: updates });
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id });
}
