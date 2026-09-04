"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarRatingDisplay } from "@/components/StarRating";
import { Product } from "@/types/product";
import { useLanguage } from "@/context/LanguageContext";
import { formatPKR, discountPercent } from "@/lib/format";
import {
  getDisplayPrice,
  getDisplayCompareAtPrice,
  hasVariants,
  isProductInStock,
} from "@/lib/variants";

export default function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useLanguage();
  const variantMode = hasVariants(product);
  const displayPrice = getDisplayPrice(product);
  const displayCompareAt = getDisplayCompareAtPrice(product);
  const discount = discountPercent(displayPrice, displayCompareAt);
  const inStock = isProductInStock(product);
  const mainImage = product.images?.[0] || "";
  const hasReviews = product.reviewCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group relative"
      style={{ perspective: "1000px" }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="focus-ring block overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:shadow-card-hover"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-mist">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name[locale]}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mist to-mist-dark text-storm/30">
                <span className="font-display text-3xl">AC</span>
              </div>
            )}
          </motion.div>

          {/* Badges */}
          <div className="absolute top-3 flex flex-col gap-1.5 ltr:left-3 rtl:right-3">
            {discount > 0 && (
              <span className="rounded-full bg-deep px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                -{discount}%
              </span>
            )}
            {variantMode && (
              <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-deep shadow-md">
                {t.product.from}
              </span>
            )}
          </div>

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50 backdrop-blur-[2px]">
              <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink shadow-lg">
                {t.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Rating row */}
          <div className="mb-1.5 flex items-center gap-1.5">
            {hasReviews ? (
              <>
                <StarRatingDisplay rating={product.rating} size={12} />
                <span className="text-[10px] font-medium text-storm">
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-[10px] text-storm/50">{t.product.noReviews}</span>
            )}
          </div>

          <h3 className="line-clamp-1 font-display text-sm font-bold text-ink">
            {product.name[locale]}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-storm">
            {product.shortDescription[locale]}
          </p>

          {/* Price row */}
          <div className="mt-2.5 flex items-baseline gap-2">
            {variantMode && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-storm">
                {locale === "ur" ? t.product.from : t.product.from}
              </span>
            )}
            <span className="font-mono text-base font-bold text-deep">
              {formatPKR(displayPrice)}
            </span>
            {displayCompareAt && displayCompareAt > displayPrice && (
              <span className="font-mono text-xs text-storm line-through">
                {formatPKR(displayCompareAt)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
