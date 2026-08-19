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

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: LocalizedText;
  category: string;
  shortDescription: LocalizedText;
  description: LocalizedText;
  features: LocalizedText[];
  price: number; // PKR
  compareAtPrice?: number; // PKR, for discount display
  images: string[];
  sizes?: ProductVariantOption[];
  colors?: ProductVariantOption[];
  stock: number;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isFeatured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: LocalizedText;
  image: string;
  price: number;
  size?: string;
  color?: string;
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
