"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartItem } from "@/types/product";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  /** Remove a cart line. Pass the full CartItem so we can match by
   *  variantId (preferred) or by size/color (legacy fallback). */
  removeItem: (item: CartItem) => void;
  updateQuantity: (item: CartItem, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "asad-cart";
const STORAGE_VERSION = "v2";
const STORAGE_KEY_VERSIONED = `${STORAGE_KEY}-${STORAGE_VERSION}`;

/**
 * Two cart lines are "the same" if they have the same productId AND the
 * same variantId. For legacy products (no variantId), fall back to
 * productId + size + color. This means 30ml and 50ml variants of the
 * same product stay as separate cart lines, never merged.
 */
function sameLine(a: CartItem, b: CartItem): boolean {
  if (a.productId !== b.productId) return false;
  // If either side has a variantId, use it as the discriminator.
  if (a.variantId || b.variantId) {
    return a.variantId === b.variantId;
  }
  // Legacy fallback.
  return a.size === b.size && a.color === b.color;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // Try the versioned key first; fall back to the legacy key for
      // shoppers who already had items in their cart before this upgrade.
      const stored =
        window.localStorage.getItem(STORAGE_KEY_VERSIONED) ||
        window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY_VERSIONED, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => sameLine(p, item));
      if (existing) {
        return prev.map((p) =>
          sameLine(p, item) ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }
      return [...prev, item];
    });
    setDrawerOpen(true);
  };

  const removeItem = (item: CartItem) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, item)));
  };

  const updateQuantity = (item: CartItem, quantity: number) => {
    setItems((prev) =>
      prev.map((p) =>
        sameLine(p, item) ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/** Stable React key for a cart line — used by .map() in the cart drawer,
 *  cart page and checkout summary. */
export function cartLineKey(item: CartItem): string {
  return [item.productId, item.variantId || "", item.size || "", item.color || ""].join("|");
}

/** Human-readable variant/sub-option label for display under a cart line. */
export function cartLineSubtitle(item: CartItem, locale: "en" | "ur"): string {
  const parts: string[] = [];
  if (item.variantLabel) {
    parts.push(item.variantLabel);
  } else {
    if (item.size) parts.push(item.size);
    if (item.color) parts.push(item.color);
  }
  return parts.join(" · ");
}
