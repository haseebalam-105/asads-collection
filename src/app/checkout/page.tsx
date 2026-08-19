"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Banknote, Loader2, Tag, X, ShieldCheck, User, MapPin, CreditCard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";
import { CustomerDetails, Coupon } from "@/types/product";

const emptyForm: CustomerDetails = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  province: "",
  postalCode: "",
  note: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState<CustomerDetails>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const deliveryFee = getDeliveryFee(subtotal);
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppliedCoupon(data.coupon);
      setDiscount(data.discount);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setCouponError("");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mist">
          <Banknote size={28} className="text-storm" />
        </div>
        <p className="mt-4 text-sm font-medium text-storm">{t.cart.empty}</p>
        <p className="mt-1 text-xs text-storm/70">{t.cart.emptySub}</p>
      </div>
    );
  }

  const update = (field: keyof CustomerDetails, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof CustomerDetails)[] = ["fullName", "phone", "city", "address"];
    const nextErrors: typeof errors = {};
    required.forEach((f) => {
      if (!form[f]?.trim()) nextErrors[f] = true;
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: form,
          couponCode: appliedCoupon?.code,
          discount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      clearCart();
      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch (err) {
      setServerError(
        locale === "ur"
          ? "آرڈر جمع نہیں ہو سکا، دوبارہ کوشش کریں۔"
          : "Could not place your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof CustomerDetails) =>
    `focus-ring w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all duration-200 placeholder:text-storm/50 ${
      errors[field]
        ? "border-red-400 ring-2 ring-red-100"
        : "border-mist-dark hover:border-storm/40 focus:border-deep"
    }`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{t.checkout.title}</h1>
        <p className="mt-1 text-sm text-storm">{t.checkout.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Contact Info */}
          <section className="rounded-xl2 border border-mist-dark bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-deep/5">
                <User size={16} className="text-deep" />
              </div>
              <h2 className="font-display text-sm font-bold text-ink">
                {t.checkout.contactInfo}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.fullName} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Muhammad Ali"
                  className={inputClass("fullName")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.email} <span className="text-storm/40 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.phone} <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  className={inputClass("phone")}
                />
              </div>
            </div>
          </section>

          {/* Shipping Info */}
          <section className="rounded-xl2 border border-mist-dark bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-deep/5">
                <MapPin size={16} className="text-deep" />
              </div>
              <h2 className="font-display text-sm font-bold text-ink">
                {t.checkout.shippingInfo}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.city} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Lahore"
                  className={inputClass("city")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.province}
                </label>
                <input
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  placeholder="Punjab"
                  className={inputClass("province")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.address} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={3}
                  placeholder="House #, Street, Area…"
                  className={inputClass("address")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.postalCode}
                </label>
                <input
                  value={form.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                  placeholder="54000"
                  className={inputClass("postalCode")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.note}
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  rows={2}
                  placeholder="Any special instructions for delivery?"
                  className={inputClass("note")}
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl2 border border-mist-dark bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-deep/5">
                <CreditCard size={16} className="text-deep" />
              </div>
              <h2 className="font-display text-sm font-bold text-ink">
                {t.checkout.payment}
              </h2>
            </div>
            <div className="flex items-start gap-3 rounded-xl border-2 border-deep/15 bg-deep/[0.02] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep/10">
                <Banknote size={18} className="text-deep" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{t.checkout.cod}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-storm">{t.checkout.codDesc}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div className="h-fit">
          <div className="rounded-xl2 border border-mist-dark bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-display text-sm font-bold text-ink">
              {t.checkout.orderSummary}
            </h2>
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <Image src={item.image} alt={item.name[locale]} fill className="object-cover" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-deep text-[10px] font-bold text-white shadow-sm">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-xs font-semibold text-ink">
                      {item.name[locale]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-storm">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-deep">
                    {formatPKR(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-mist-dark pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-green-50 px-3.5 py-2.5 text-xs font-semibold text-green-700">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} /> {appliedCoupon.code} applied
                  </span>
                  <button type="button" onClick={removeCoupon} className="focus-ring rounded-full p-0.5 hover:bg-green-100">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={locale === "ur" ? "کوپن کوڈ" : "Coupon code"}
                    className="focus-ring flex-1 rounded-xl border border-mist-dark px-3 py-2.5 text-xs uppercase transition-colors hover:border-storm/40"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    className="focus-ring rounded-xl border border-mist-dark px-4 py-2.5 text-xs font-semibold text-deep transition-colors hover:bg-mist disabled:opacity-60"
                  >
                    {applyingCoupon ? "…" : locale === "ur" ? "لگائیں" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{couponError}</p>
              )}
            </div>

            <div className="mt-4 space-y-2.5 border-t border-mist-dark pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-storm">{t.cart.subtotal}</span>
                <span className="font-mono font-semibold text-ink">{formatPKR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-700">
                  <span>{t.checkout.discount}</span>
                  <span className="font-mono font-semibold">-{formatPKR(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-storm">{t.cart.delivery}</span>
                <span className="font-mono font-semibold text-ink">
                  {deliveryFee === 0 ? (locale === "ur" ? "مفت" : "Free") : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-mist-dark pt-3">
                <span className="font-bold text-ink">{t.cart.total}</span>
                <span className="font-mono text-lg font-bold text-deep">{formatPKR(total)}</span>
              </div>
            </div>

            {serverError && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-deep py-4 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all duration-200 hover:bg-deep-light hover:shadow-deep/30 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? t.checkout.placing : t.checkout.placeOrder}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-storm/60">
              <ShieldCheck size={12} />
              <span>{t.checkout.secureCheckout}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
