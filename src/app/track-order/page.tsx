"use client";

import { useState } from "react";
import { Search, Loader2, PackageCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Order } from "@/types/product";
import { formatPKR } from "@/lib/format";

const statusSteps: Order["status"][] = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export default function TrackOrderPage() {
  const { t, locale } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
    } catch {
      setError(
        locale === "ur"
          ? "آرڈر نہیں ملا۔ نمبر اور فون درست چیک کریں۔"
          : "Order not found. Check your order number and phone."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-center font-display text-2xl font-extrabold text-ink">
        {t.nav.track}
      </h1>
      <p className="mb-8 text-center text-sm text-storm">
        {locale === "ur"
          ? "اپنا آرڈر نمبر اور فون نمبر درج کریں۔"
          : "Enter your order number and phone number to check status."}
      </p>

      <form onSubmit={handleSearch} className="space-y-4 rounded-xl2 border border-mist-dark p-6">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-storm">
            {t.confirmation.orderNumber}
          </label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="AC-20260801-1234"
            className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-storm">
            {t.checkout.phone}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xx-xxxxxxx"
            className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-deep py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {locale === "ur" ? "تلاش کریں" : "Track Order"}
        </button>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </form>

      {order && (
        <div className="mt-8 rounded-xl2 border border-mist-dark p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-deep">{order.orderNumber}</span>
            <span className="font-mono text-sm font-bold text-ink">{formatPKR(order.total)}</span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    i <= currentStepIndex ? "bg-deep text-white" : "bg-mist text-storm"
                  }`}
                >
                  <PackageCheck size={14} />
                </div>
                <span className="mt-1.5 text-center text-[10px] capitalize text-storm">
                  {step}
                </span>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`absolute mt-4 h-0.5 w-full translate-x-1/2 ${
                      i < currentStepIndex ? "bg-deep" : "bg-mist"
                    }`}
                    style={{ display: "none" }}
                  />
                )}
              </div>
            ))}
          </div>

          {order.status === "cancelled" && (
            <p className="mt-4 text-center text-sm font-semibold text-red-500">
              This order was cancelled.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
