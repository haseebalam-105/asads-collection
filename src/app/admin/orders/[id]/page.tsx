"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Order, OrderStatus } from "@/types/product";
import { formatPKR } from "@/lib/format";

const statusOptions: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrder(data.order);
      });
  };

  useEffect(load, [params.id]);

  const updateStatus = async (status: OrderStatus) => {
    setSaving(true);
    await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    setSaving(false);
  };

  const markPaid = async () => {
    setSaving(true);
    await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: order?.status, paymentStatus: "paid" }),
    });
    load();
    setSaving(false);
  };

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (!order) {
    return <p className="text-sm text-storm">Loading…</p>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/orders")}
        className="focus-ring mb-5 flex items-center gap-1.5 text-sm font-medium text-storm hover:text-deep"
      >
        <ArrowLeft size={15} /> Back to Orders
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-extrabold text-deep">{order.orderNumber}</h1>
          <p className="text-xs text-storm">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {order.paymentStatus === "paid" ? "Paid" : "Unpaid (COD)"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl2 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Items</h2>
            <ul className="space-y-3">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <Image src={item.image} alt={item.name.en} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{item.name.en}</p>
                    <p className="text-xs text-storm">
                      {[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-deep">
                    {formatPKR(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-mist-dark pt-3 text-sm">
              <div className="flex justify-between text-storm">
                <span>Subtotal</span>
                <span className="font-mono">{formatPKR(order.subtotal)}</span>
              </div>
              {!!order.discount && (
                <div className="flex justify-between text-green-700">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span className="font-mono">-{formatPKR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-storm">
                <span>Delivery</span>
                <span className="font-mono">{formatPKR(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-ink">
                <span>Total</span>
                <span className="font-mono">{formatPKR(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl2 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Customer</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-storm">Name</dt>
                <dd className="text-ink">{order.customer.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs text-storm">Phone</dt>
                <dd className="text-ink">{order.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-storm">Email</dt>
                <dd className="text-ink">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-storm">City</dt>
                <dd className="text-ink">{order.customer.city}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-storm">Address</dt>
                <dd className="text-ink">{order.customer.address}</dd>
              </div>
              {order.customer.note && (
                <div className="col-span-2">
                  <dt className="text-xs text-storm">Note</dt>
                  <dd className="text-ink">{order.customer.note}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <div className="h-fit space-y-4 rounded-xl2 bg-white p-5 shadow-card">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">
              Update Status
            </label>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => updateStatus(e.target.value as OrderStatus)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm capitalize"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {order.paymentStatus !== "paid" && (
            <button
              onClick={markPaid}
              disabled={saving}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-full border border-mist-dark py-2.5 text-sm font-semibold text-deep disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Mark as Paid
            </button>
          )}

          <a
            href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring block rounded-full bg-[#25D366] py-2.5 text-center text-sm font-semibold text-white"
          >
            Message on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
