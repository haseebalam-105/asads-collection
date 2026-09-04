"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, cartLineKey, cartLineSubtitle } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR } from "@/lib/format";

export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem, subtotal } =
    useCart();
  const { t, locale, dir } = useLanguage();

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40"
            onClick={closeDrawer}
          />
          <motion.div
            initial={{ x: dir === "rtl" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: dir === "rtl" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-y-0 rtl:left-0 ltr:right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-mist-dark p-4">
              <h2 className="font-display text-base font-bold text-ink">
                {t.cart.title}
              </h2>
              <button
                onClick={closeDrawer}
                className="focus-ring rounded-full p-1.5 hover:bg-mist"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-sm font-medium text-ink">{t.cart.empty}</p>
                <p className="text-xs text-storm">{t.cart.emptySub}</p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="focus-ring mt-2 rounded-full bg-deep px-5 py-2 text-sm font-semibold text-white"
                >
                  {t.cart.continueShopping}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-4">
                    {items.map((item) => {
                      const subtitle = cartLineSubtitle(item, locale);
                      return (
                        <li key={cartLineKey(item)} className="flex gap-3">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                            <Image
                              src={item.image}
                              alt={item.name[locale]}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <p className="line-clamp-1 text-sm font-semibold text-ink">
                                {item.name[locale]}
                              </p>
                              {subtitle && (
                                <p className="text-xs text-storm">{subtitle}</p>
                              )}
                              {item.variantSku && (
                                <p className="font-mono text-[10px] text-storm/70">
                                  {item.variantSku}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-mist-dark px-2 py-1">
                                <button
                                  onClick={() => updateQuantity(item, item.quantity - 1)}
                                  className="focus-ring text-storm hover:text-deep"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-4 text-center text-xs font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item, item.quantity + 1)}
                                  className="focus-ring text-storm hover:text-deep"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <span className="font-mono text-sm font-semibold text-deep">
                                {formatPKR(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item)}
                            className="focus-ring self-start text-storm hover:text-red-500"
                            aria-label={t.cart.remove}
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-mist-dark p-4">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-storm">{t.cart.subtotal}</span>
                    <span className="font-mono font-semibold text-ink">
                      {formatPKR(subtotal)}
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="focus-ring block rounded-full bg-deep py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-deep-light"
                  >
                    {t.cart.checkout}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
