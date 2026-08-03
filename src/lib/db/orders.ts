import { getDb } from "@/lib/db";
import { Order, OrderStatus } from "@/types/product";

const COLLECTION = "orders";

export async function dbSaveOrder(order: Order): Promise<Order> {
  const db = await getDb();
  await db.collection<Order>(COLLECTION).insertOne(order as any);
  return order;
}

export async function dbGetOrders(filters?: {
  status?: OrderStatus;
  search?: string;
}): Promise<Order[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (filters?.status) query.status = filters.status;
  if (filters?.search) {
    const re = new RegExp(filters.search, "i");
    query.$or = [
      { orderNumber: re },
      { "customer.fullName": re },
      { "customer.phone": re },
    ];
  }
  return db
    .collection<Order>(COLLECTION)
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Order[]>;
}

export async function dbGetOrderById(id: string): Promise<Order | null> {
  const db = await getDb();
  return db
    .collection<Order>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } }) as Promise<Order | null>;
}

export async function dbFindOrder(orderNumber: string, phone: string): Promise<Order | null> {
  const db = await getDb();
  const cleanPhone = phone.replace(/\s|-/g, "");
  const order = await db
    .collection<Order>(COLLECTION)
    .findOne(
      { orderNumber: new RegExp(`^${orderNumber}$`, "i") },
      { projection: { _id: 0 } }
    );
  if (!order) return null;
  if (order.customer.phone.replace(/\s|-/g, "") !== cleanPhone) return null;
  return order as Order;
}

export async function dbUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  paymentStatus?: "unpaid" | "paid"
): Promise<Order | null> {
  const db = await getDb();
  const updates: Record<string, unknown> = { status };
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  await db.collection(COLLECTION).updateOne({ id }, { $set: updates });
  return dbGetOrderById(id);
}

export async function dbGetOrderStats() {
  const db = await getDb();
  const orders = await db.collection<Order>(COLLECTION).find({}).toArray();
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter((o) => ["new", "confirmed", "processing"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  return { totalOrders, totalRevenue, pending, delivered, cancelled, orders };
}
