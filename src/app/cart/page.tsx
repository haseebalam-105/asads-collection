"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR } from "@/lib/format";
import { getDeliveryFee } from "@/lib/settings";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { t, locale } = useLanguage();
  const deliveryFee = getDeliveryFee(subtotal);
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-ink">{t.cart.empty}</h1>
        <p className="mt-2 text-sm text-storm">{t.cart.emptySub}</p>
        <Link
          href="/shop"
          className="focus-ring mt-6 rounded-full bg-deep px-6 py-3 text-sm font-semibold text-white"
        >
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-2xl font-extrabold text-ink">{t.cart.title}</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.size}-${item.color}`}
              className="flex gap-4 rounded-xl2 border border-mist-dark p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-mist sm:h-28 sm:w-28">
                <Image src={item.image} alt={item.name[locale]} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="font-display text-sm font-bold text-ink sm:text-base">
                    {item.name[locale]}
                  </p>
                  <p className="mt-0.5 text-xs text-storm">
                    {[item.size, item.color].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 rounded-full border border-mist-dark px-3 py-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1, item.size, item.color)
                      }
                      className="focus-ring text-storm hover:text-deep"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1, item.size, item.color)
                      }
                      className="focus-ring text-storm hover:text-deep"
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
                onClick={() => removeItem(item.productId, item.size, item.color)}
                className="focus-ring self-start text-storm hover:text-red-500"
                aria-label={t.cart.remove}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-xl2 border border-mist-dark p-6">
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
              <span className="font-mono font-bold text-deep">{formatPKR(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="focus-ring mt-6 flex items-center justify-center gap-2 rounded-full bg-deep py-3.5 text-sm font-bold text-white transition-colors hover:bg-deep-light"
          >
            {t.cart.checkout}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
