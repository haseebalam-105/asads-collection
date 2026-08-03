"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
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

const statusColors: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  confirmed: "bg-indigo-50 text-indigo-700",
  processing: "bg-amber-50 text-amber-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-gray-100 text-gray-700",
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
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        <p className="font-semibold">Database not connected yet</p>
        <p className="mt-1 text-storm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold text-ink">Orders</h1>
        <a
          href={`/api/admin/orders?export=csv${status !== "all" ? `&status=${status}` : ""}`}
          className="focus-ring flex items-center gap-1.5 rounded-full border border-mist-dark px-4 py-2 text-sm font-semibold text-deep"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-storm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name, phone…"
            className="focus-ring w-64 rounded-full border border-mist-dark py-2 pl-9 pr-4 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                status === s ? "bg-deep text-white" : "bg-white text-storm hover:bg-mist"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-storm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-b border-mist-dark last:border-0 hover:bg-mist"
                  onClick={() => (window.location.href = `/admin/orders/${o.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-deep">
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{o.customer.fullName}</p>
                    <p className="text-[11px] text-storm">{o.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{o.items.length} item(s)</td>
                  <td className="px-4 py-3 font-mono font-semibold text-ink">
                    {formatPKR(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColors[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-storm">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-storm">
                    No orders found.
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
