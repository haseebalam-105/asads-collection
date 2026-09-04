import { Order } from "@/types/product";
import { isDbConfigured } from "@/lib/db";
import { dbSaveOrder, dbFindOrder } from "@/lib/db/orders";

/**
 * Order persistence layer.
 *
 * Behavior:
 *  - When MONGODB_URI is NOT configured (local dev without a DB), orders
 *    are stored in an in-memory store so the checkout flow can still be
 *    exercised end-to-end. This is the explicit "development/demo mode".
 *  - When MONGODB_URI IS configured (production), orders MUST be saved to
 *    MongoDB. If the DB save fails, the error is propagated — we never
 *    silently fall back to the memory store in production, because that
 *    would tell the customer their order was placed when it actually
 *    wasn't persisted anywhere durable.
 */

declare global {
  // eslint-disable-next-line no-var
  var __ORDERS_STORE__: Order[] | undefined;
}

const memoryStore: Order[] = globalThis.__ORDERS_STORE__ ?? [];
globalThis.__ORDERS_STORE__ = memoryStore;

/** True when running without a configured MongoDB — development/demo mode. */
const DEV_MODE_NO_DB = !isDbConfigured();

export async function saveOrder(order: Order): Promise<Order> {
  if (DEV_MODE_NO_DB) {
    // Explicit development mode — no DB configured.
    memoryStore.push(order);
    return order;
  }
  // Production path — DB is configured. Propagate errors so the caller
  // can return a proper failure response instead of fake success.
  return await dbSaveOrder(order);
}

export function getOrders() {
  return memoryStore;
}

export async function findOrder(orderNumber: string, phone: string): Promise<Order | undefined> {
  if (DEV_MODE_NO_DB) {
    return memoryStore.find(
      (o) =>
        o.orderNumber.toLowerCase() === orderNumber.toLowerCase() &&
        o.customer.phone.replace(/\s|-/g, "") === phone.replace(/\s|-/g, "")
    );
  }
  try {
    const order = await dbFindOrder(orderNumber, phone);
    return order ?? undefined;
  } catch (err) {
    // Lookup is read-only and customer-facing (order tracking). If the DB
    // is briefly unavailable, we'd rather show "order not found" than
    // crash the tracking page. Log the error server-side.
    console.error("[orders-store] findOrder DB error:", err);
    return undefined;
  }
}
