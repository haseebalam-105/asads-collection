import { getDb } from "@/lib/db";
import { Order, Customer } from "@/types/product";

export async function dbGetCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const orders = await db.collection<Order>("orders").find({}).toArray();

  const byPhone = new Map<string, Customer>();
  for (const o of orders) {
    const key = o.customer.phone.replace(/\s|-/g, "");
    const existing = byPhone.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += o.total;
      if (new Date(o.createdAt) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = o.createdAt;
      }
    } else {
      byPhone.set(key, {
        phone: o.customer.phone,
        fullName: o.customer.fullName,
        email: o.customer.email,
        city: o.customer.city,
        orderCount: 1,
        totalSpent: o.total,
        lastOrderAt: o.createdAt,
      });
    }
  }

  return Array.from(byPhone.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  );
}

export async function dbGetOrdersForCustomer(phone: string): Promise<Order[]> {
  const db = await getDb();
  const cleanPhone = phone.replace(/\s|-/g, "");
  const orders = await db.collection<Order>("orders").find({}).toArray();
  return orders.filter((o) => o.customer.phone.replace(/\s|-/g, "") === cleanPhone) as Order[];
}
