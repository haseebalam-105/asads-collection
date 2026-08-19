"use client";

import { useEffect, useState } from "react";
import { Download, Search, ShoppingBag } from "lucide-react";
import { Order, OrderStatus } from "@/types/product";
import { formatPKR } from "@/lib/format";

const statuses: (OrderStatus | "all")[] = [
  "all",
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const statusStyles: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-100",
  confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  processing: "bg-amber-50 text-amber-700 ring-amber-100",
  shipped: "bg-purple-50 text-purple-700 ring-purple-100",
  delivered: "bg-green-50 text-green-700 ring-green-100",
  cancelled: "bg-red-50 text-red-600 ring-red-100",
  returned: "bg-gray-100 text-gray-600 ring-gray-100",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  }, [status, search]);

  if (error) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/5 to-gold/10 p-8 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <ShoppingBag size={20} className="text-gold-deep" />
          </div>
          <div>
            <p className="font-semibold text-deep">Database not connected yet</p>
            <p className="mt-0.5 text-storm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-storm">Manage and track customer orders</p>
        </div>
        <a
          href={`/api/admin/orders?export=csv${status !== "all" ? `&status=${status}` : ""}`}
          className="focus-ring flex items-center gap-2 rounded-xl border border-mist-dark px-5 py-2.5 text-sm font-semibold text-deep transition-colors hover:bg-mist"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-storm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name, phone…"
            className="focus-ring w-full rounded-xl border border-mist-dark py-2.5 pl-10 pr-4 text-sm transition-colors hover:border-storm/40 focus:border-deep"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                status === s
                  ? "bg-deep text-white shadow-sm"
                  : "bg-white text-storm ring-1 ring-mist-dark hover:bg-mist"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-storm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-deep border-t-transparent" />
          Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mist-dark/60 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark bg-mist/50 text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-5 py-3.5 font-semibold">Order #</th>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Items</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-b border-mist-dark/50 last:border-0 transition-colors hover:bg-mist/30"
                  onClick={() => (window.location.href = `/admin/orders/${o.id}`)}
                >
                  <td className="px-5 py-4 font-mono text-xs font-bold text-deep">
                    {o.orderNumber}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{o.customer.fullName}</p>
                    <p className="text-[11px] text-storm">{o.customer.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-ink/60">{o.items.length} item(s)</td>
                  <td className="px-5 py-4 font-mono font-semibold text-ink">
                    {formatPKR(o.total)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-storm">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-storm">
                    <ShoppingBag size={32} className="mx-auto mb-3 text-mist-dark" />
                    <p className="font-medium">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
