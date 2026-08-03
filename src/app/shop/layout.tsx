import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse waterproof rain coats, motorcycle covers, car covers and home protection products from Asad's Collection.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
