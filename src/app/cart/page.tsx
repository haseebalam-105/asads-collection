"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart, cartLineKey, cartLineSubtitle } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";
import { useSettings } from "@/context/SettingsContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { t, locale } = useLanguage();
  const settings = useSettings();
  const deliveryFee = getDeliveryFee(subtotal, settings);
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-mist">
          <ShoppingBag size={32} className="text-storm" />
        </div>
        <h1 className="mt-6 font-display text-xl font-bold text-ink">{t.cart.empty}</h1>
        <p className="mt-2 text-sm text-storm">{t.cart.emptySub}</p>
        <Link
          href="/shop"
          className="focus-ring mt-8 rounded-xl bg-deep px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all hover:bg-deep-light hover:shadow-deep/30"
        >
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.cart.title}</h1>
        <p className="mt-1 text-sm text-storm">{items.length} {t.cart.itemCount}</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {items.map((item) => {
            const subtitle = cartLineSubtitle(item, locale);
            return (
              <li
                key={cartLineKey(item)}
                className="flex gap-4 rounded-2xl border border-mist-dark/60 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-mist sm:h-32 sm:w-32 ring-1 ring-mist-dark/30">
                  <Image src={item.image} alt={item.name[locale]} fill className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="font-display text-sm font-bold text-ink sm:text-base">
                      {item.name[locale]}
                    </p>
                    {subtitle && <p className="mt-1 text-xs text-storm">{subtitle}</p>}
                    {item.variantSku && (
                      <p className="font-mono text-[10px] text-storm/70">{item.variantSku}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-mist-dark px-3 py-2">
                      <button
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        className="focus-ring text-storm transition-colors hover:text-deep"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        className="focus-ring text-storm transition-colors hover:text-deep"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-mono text-sm font-bold text-deep sm:text-base">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item)}
                  className="focus-ring self-start rounded-lg p-2 text-storm/50 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={t.cart.remove}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="h-fit rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-display text-sm font-bold text-ink">{t.cart.orderSummary}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-storm">{t.cart.subtotal}</span>
              <span className="font-mono font-semibold text-ink">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-storm">{t.cart.delivery}</span>
              <span className="font-mono font-semibold text-ink">
                {deliveryFee === 0 ? (locale === "ur" ? "مفت" : "Free") : formatPKR(deliveryFee)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-mist-dark pt-3 text-base">
              <span className="font-bold text-ink">{t.cart.total}</span>
              <span className="font-mono text-lg font-bold text-deep">{formatPKR(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="focus-ring mt-6 flex items-center justify-center gap-2 rounded-xl bg-deep py-4 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all duration-200 hover:bg-deep-light hover:shadow-deep/30 active:scale-[0.98]"
          >
            {t.cart.checkout}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>

          <Link
            href="/shop"
            className="focus-ring mt-3 block rounded-xl py-3 text-center text-sm font-medium text-storm transition-colors hover:bg-mist hover:text-deep"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}
