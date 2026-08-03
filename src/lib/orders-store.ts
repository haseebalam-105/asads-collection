import { Order } from "@/types/product";
import { isDbConfigured } from "@/lib/db";
import { dbSaveOrder, dbFindOrder } from "@/lib/db/orders";

// Delegates to MongoDB once MONGODB_URI is configured (see .env.example).
// Falls back to an in-memory store so checkout still works end-to-end
// before a database is connected — orders just won't survive a server
// restart until then.

declare global {
  // eslint-disable-next-line no-var
  var __ORDERS_STORE__: Order[] | undefined;
}

const memoryStore: Order[] = globalThis.__ORDERS_STORE__ ?? [];
globalThis.__ORDERS_STORE__ = memoryStore;

export async function saveOrder(order: Order): Promise<Order> {
  if (isDbConfigured()) {
    try {
      return await dbSaveOrder(order);
    } catch {
      // fall through to memory store if the DB call fails
    }
  }
  memoryStore.push(order);
  return order;
}

export function getOrders() {
  return memoryStore;
}

export async function findOrder(orderNumber: string, phone: string): Promise<Order | undefined> {
  if (isDbConfigured()) {
    try {
      const order = await dbFindOrder(orderNumber, phone);
      if (order) return order;
    } catch {
      // fall through to memory store
    }
  }
  return memoryStore.find(
    (o) =>
      o.orderNumber.toLowerCase() === orderNumber.toLowerCase() &&
      o.customer.phone.replace(/\s|-/g, "") === phone.replace(/\s|-/g, "")
  );
}
