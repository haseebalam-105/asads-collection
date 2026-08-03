"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Droplets } from "lucide-react";
import { Product } from "@/types/product";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR, discountPercent } from "@/lib/format";
import StarRating from "./StarRating";

export default function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useLanguage();
  const discount = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative"
      style={{ perspective: "1000px" }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="focus-ring block rounded-xl2 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover"
      >
        <div className="relative aspect-square overflow-hidden rounded-t-xl2 bg-mist">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.06, rotateX: 2, rotateY: -2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Image
              src={product.images[0]}
              alt={product.name[locale]}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </motion.div>

          {discount > 0 && (
            <span className="absolute top-3 rtl:right-3 ltr:left-3 rounded-full bg-deep px-2.5 py-1 text-xs font-semibold text-white shadow">
              -{discount}%
            </span>
          )}

          <span className="absolute top-3 rtl:left-3 ltr:right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-deep shadow backdrop-blur">
            <Droplets size={11} className="text-gold" />
            100%
          </span>

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
                {t.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-display text-sm font-bold text-ink line-clamp-1">
            {product.name[locale]}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-storm">
            {product.shortDescription[locale]}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.rating} />
            <span className="text-[11px] text-storm">({product.reviewCount})</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2 font-mono">
            <span className="text-base font-semibold text-deep">
              {formatPKR(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-storm line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
