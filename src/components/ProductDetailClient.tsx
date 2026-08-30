"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, Minus, Plus, Check } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPKR, discountPercent } from "@/lib/format";
import { trackMetaEvent } from "@/lib/meta-track";
import { Product } from "@/types/product";

export default function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { addItem } = useCart();

  const [size, setSize] = useState(product?.sizes?.[0]?.value);
  const [color, setColor] = useState(product?.colors?.[0]?.value);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const discount = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;

  // Meta ViewContent — fired once when the customer lands on this product.
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      currency: "PKR",
      value: product.price,
      content_ids: [product.id],
      content_name: product.name.en,
      content_type: "product",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size,
      color,
      quantity,
    });
    trackMetaEvent("AddToCart", {
      currency: "PKR",
      value: product.price * quantity,
      content_ids: [product.id],
      content_name: product.name.en,
      content_type: "product",
      contents: [{ id: product.id, quantity, item_price: product.price }],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    handleAdd();
    router.push("/cart");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="group relative aspect-square overflow-hidden rounded-xl2 bg-mist"
          >
            <Image
              src={product.images[0]}
              alt={product.name[locale]}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 rtl:right-4 ltr:left-4 rounded-full bg-deep px-3 py-1 text-xs font-semibold text-white shadow">
                -{discount}%
              </span>
            )}
            <span className="absolute top-4 rtl:left-4 ltr:right-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-deep shadow">
              <Droplets size={12} className="text-gold" />
              100% Waterproof
            </span>
          </motion.div>
        </div>

        {/* Info */}
        <div>
          <p className="font-mono text-xs text-storm">{product.sku}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {product.name[locale]}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <StarRating rating={product.rating} size={16} />
            <span className="text-xs text-storm">
              {product.rating} {t.product.rated} · {product.reviewCount} {t.product.reviews}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3 font-mono">
            <span className="text-2xl font-bold text-deep">{formatPKR(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-storm line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink/80">
            {product.description[locale]}
          </p>

          <div className="mt-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-green-600" : "bg-red-600"}`} />
              {inStock ? t.product.inStock : t.product.outOfStock}
            </span>
          </div>

          {product.sizes && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">
                {t.product.size}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.value}
                    disabled={!s.inStock}
                    onClick={() => setSize(s.value)}
                    className={`focus-ring rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      size === s.value
                        ? "border-deep bg-deep text-white"
                        : s.inStock
                        ? "border-mist-dark text-ink hover:border-deep"
                        : "border-mist-dark text-storm/40 line-through"
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && (
            <div className="mt-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">
                {t.product.color}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      color === c.value ? "border-deep bg-mist" : "border-mist-dark hover:border-deep"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-mist-dark"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    {c.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">
              {t.product.quantity}
            </h3>
            <div className="inline-flex items-center gap-3 rounded-full border border-mist-dark px-3 py-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="focus-ring text-storm hover:text-deep"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="focus-ring text-storm hover:text-deep"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={!inStock}
              onClick={handleAdd}
              className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-deep px-6 py-3.5 text-sm font-bold text-deep transition-colors hover:bg-deep hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? <Check size={16} /> : null}
              {added ? "Added!" : t.product.addToCart}
            </button>
            <button
              disabled={!inStock}
              onClick={handleBuyNow}
              className="focus-ring flex-1 rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-deep transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.product.buyNow}
            </button>
          </div>

          {/* Features */}
          <div className="mt-10 border-t border-mist-dark pt-6">
            <h3 className="mb-3 font-display text-sm font-bold text-ink">
              {t.product.features}
            </h3>
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f.en} className="flex items-start gap-2 text-sm text-ink/80">
                  <Droplets size={14} className="mt-0.5 shrink-0 text-gold" />
                  {f[locale]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 border-t border-mist-dark pt-10">
        <h2 className="mb-6 font-display text-xl font-bold text-ink">
          {t.product.reviews} ({product.reviewCount})
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-xl2 border border-mist-dark p-5">
              <StarRating rating={r.rating} />
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{r.comment}</p>
              <p className="mt-3 text-xs font-semibold text-storm">{r.customerName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16 border-t border-mist-dark pt-10">
          <h2 className="mb-6 font-display text-xl font-bold text-ink">
            {t.product.related}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
