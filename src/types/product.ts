export type Locale = "en" | "ur";

export interface LocalizedText {
  en: string;
  ur: string;
}

export interface ProductVariantOption {
  value: string;
  colorHex?: string;
  inStock: boolean;
}

/**
 * Generic product variant. A variant owns its own price, stock, sku and
 * (optionally) its own images. `options` is a free-form record so the
 * admin can model Volume, Size, Color, Style, Material, etc. — not just
 * size/color. The variant `id` is the canonical reference stored in the
 * cart and verified server-side at checkout.
 */
export interface ProductVariant {
  id: string;
  label: string;
  options: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  images?: string[];
  active: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  /** Optional review title (added in the reviews upgrade). */
  title?: string;
  /** Optional customer email — used only for duplicate-review detection. */
  customerEmail?: string;
  /** True only when we can confirm the reviewer actually purchased the
   *  product. Never set to true blindly. */
  verifiedPurchase?: boolean;
  /** ISO timestamp of the last edit, if any. */
  updatedAt?: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: LocalizedText;
  /** Legacy free-text category slug. Kept for backward compatibility with
   *  existing products; new products should also set categoryId. */
  category: string;
  /** Stable FK into the categories collection. Preferred over `category`. */
  categoryId?: string;
  shortDescription: LocalizedText;
  description: LocalizedText;
  features: LocalizedText[];
  /** Base price — used for product cards, sorting, SEO and legacy products. */
  price: number;
  compareAtPrice?: number;
  images: string[];
  /** Legacy size/color options. Kept for backward compatibility. New
   *  products should use `variants` instead. */
  sizes?: ProductVariantOption[];
  colors?: ProductVariantOption[];
  /** Generic variant list. If non-empty, the storefront uses variant
   *  pricing/stock/images and falls back to `price`/`stock`/`images`
   *  only for legacy products without variants. */
  variants?: ProductVariant[];
  stock: number;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isFeatured: boolean;
  createdAt: string;
}

/**
 * Cart line. Upgraded to carry the selected variant so the cart, checkout,
 * order and admin order views all show the correct variant-specific image,
 * price, sku and options. Line uniqueness is now keyed on
 * `productId + variantId` (with a fallback to size/color for legacy items).
 */
export interface CartItem {
  productId: string;
  slug: string;
  name: LocalizedText;
  image: string;
  price: number;
  size?: string;
  color?: string;
  /** ID of the selected ProductVariant, if any. */
  variantId?: string;
  /** Human-readable variant label, e.g. "50ml" or "Large / Black". */
  variantLabel?: string;
  /** The exact selected option combination, e.g. { Volume: "50ml" }. */
  selectedOptions?: Record<string, string>;
  /** Variant-specific SKU if the variant defines one. */
  variantSku?: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  province?: string;
  postalCode?: string;
  note?: string;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  coverImage: string;
  published: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  phone: string;
  fullName: string;
  email: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customer: CustomerDetails;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  couponCode?: string;
  total: number;
  paymentMethod: "cod";
  paymentStatus: "unpaid" | "paid";
  status: OrderStatus;
  createdAt: string;
}

/**
 * Admin-managed category. Stored in MongoDB `categories` collection and
 * editable at /admin/categories. The storefront reads these dynamically
 * via getAllCategoriesAsync() — no redeploy required to add a category.
 */
export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  description?: LocalizedText;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
