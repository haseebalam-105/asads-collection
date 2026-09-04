"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  Check,
  X,
  Star,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Loader2,
  MessageSquare,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { StarRatingDisplay, StarRatingInput } from "@/components/StarRating";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPKR, discountPercent } from "@/lib/format";
import { trackMetaEvent } from "@/lib/meta-track";
import { Product, ProductVariant, Review } from "@/types/product";
import {
  activeVariants,
  findVariant,
  findVariantByImage,
  findVariantByOptions,
  formatVariantLabel,
  getDefaultVariant,
  getGalleryImages,
  getOptionNames,
  getOptionValues,
  hasVariants,
  isProductInStock,
} from "@/lib/variants";

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

  // ----- Variant state -----
  const variantMode = hasVariants(product);
  const variants = useMemo(() => activeVariants(product), [product]);
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    defaultVariant?.id
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!variantMode || !defaultVariant) return {};
    return { ...(defaultVariant.options || {}) };
  });
  const [selectedImage, setSelectedImage] = useState<string>(product.images?.[0] || "");

  const [size, setSize] = useState(product?.sizes?.[0]?.value);
  const [color, setColor] = useState(product?.colors?.[0]?.value);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // ----- Reviews state -----
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(product.reviewCount);
  const [avgRating, setAvgRating] = useState(product.rating);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch approved reviews from the public API (so newly-approved reviews
  // show up without a page refresh).
  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews);
          setReviewCount(data.reviewCount ?? 0);
          setAvgRating(data.rating ?? 0);
        }
      })
      .catch(() => {});
  }, [product.id]);

  // ----- Derived display values -----
  const selectedVariant: ProductVariant | undefined = useMemo(
    () => findVariant(product, selectedVariantId),
    [product, selectedVariantId]
  );
  const combinationIsValid = !variantMode || !!selectedVariant;

  const displayPrice = variantMode
    ? (selectedVariant?.price ?? 0)
    : product.price;
  const displayCompareAtPrice = variantMode
    ? selectedVariant?.compareAtPrice
    : product.compareAtPrice;
  const displayStock = variantMode
    ? (selectedVariant?.stock ?? 0)
    : product.stock;
  const displaySku = variantMode
    ? (selectedVariant?.sku || product.sku)
    : product.sku;
  const inStock = variantMode
    ? combinationIsValid && (selectedVariant?.stock ?? 0) > 0
    : product.stock > 0;
  const overallInStock = isProductInStock(product);
  const discount = discountPercent(displayPrice, displayCompareAtPrice);

  const galleryImages = useMemo(
    () => getGalleryImages(product, selectedVariantId),
    [product, selectedVariantId]
  );

  useEffect(() => {
    if (variantMode && selectedVariant?.images?.length) {
      setSelectedImage(selectedVariant.images[0]);
    } else if (galleryImages.length > 0 && !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [selectedVariantId, selectedVariant, galleryImages, variantMode, selectedImage]);

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      currency: "PKR",
      value: displayPrice,
      content_ids: [product.id],
      content_name: product.name.en,
      content_type: "product",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const optionNames = useMemo(() => getOptionNames(product), [product]);

  const handleSelectOption = (optionName: string, value: string) => {
    const next = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(next);
    const match = findVariantByOptions(product, next);
    if (match) {
      setSelectedVariantId(match.id);
    } else {
      setSelectedVariantId(undefined);
    }
  };

  const handleSelectVariant = (variantId: string) => {
    const v = findVariant(product, variantId);
    if (!v) return;
    setSelectedVariantId(variantId);
    setSelectedOptions({ ...(v.options || {}) });
  };

  const handleSelectImage = (url: string) => {
    setSelectedImage(url);
    if (variantMode) {
      const owner = findVariantByImage(product, url);
      if (owner && owner.id !== selectedVariantId) {
        setSelectedVariantId(owner.id);
        setSelectedOptions({ ...(owner.options || {}) });
      }
    }
  };

  const handleAdd = () => {
    if (variantMode) {
      if (!selectedVariant || !combinationIsValid) return;
      const variantImage =
        selectedVariant.images?.[0] ||
        product.images?.[0] ||
        selectedImage ||
        "";
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: variantImage,
        price: selectedVariant.price,
        variantId: selectedVariant.id,
        variantLabel: formatVariantLabel(selectedVariant),
        selectedOptions: { ...(selectedVariant.options || {}) },
        variantSku: selectedVariant.sku,
        quantity,
      });
      trackMetaEvent("AddToCart", {
        currency: "PKR",
        value: selectedVariant.price * quantity,
        content_ids: [product.id],
        content_name: product.name.en,
        content_type: "product",
        contents: [{ id: product.id, quantity, item_price: selectedVariant.price }],
      });
    } else {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0] || selectedImage || "",
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
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    handleAdd();
    router.push("/cart");
  };

  const mainImage = selectedImage || galleryImages[0] || product.images?.[0] || "";

  // Rating distribution
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    }
    return dist;
  }, [reviews]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ===== Gallery ===== */}
        <div>
          <motion.div
            key={mainImage}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-mist shadow-card"
          >
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name[locale]}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-storm/30">
                <span className="font-display text-5xl">AC</span>
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 ltr:left-4 rtl:right-4 rounded-full bg-deep px-3 py-1 text-xs font-bold text-white shadow-lg">
                -{discount}%
              </span>
            )}
          </motion.div>

          {galleryImages.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {galleryImages.map((url) => {
                const isActive = url === mainImage;
                const owner = variantMode ? findVariantByImage(product, url) : undefined;
                return (
                  <button
                    key={url}
                    onClick={() => handleSelectImage(url)}
                    className={`focus-ring relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-mist transition-all ${
                      isActive
                        ? "border-deep ring-2 ring-deep/20"
                        : "border-mist-dark/60 hover:border-storm/50"
                    }`}
                    aria-label={isActive ? "Selected image" : "View image"}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                    {owner && (
                      <span className="absolute bottom-0 left-0 right-0 truncate bg-deep/80 px-1 py-0.5 text-[8px] font-bold text-white">
                        {formatVariantLabel(owner)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Info ===== */}
        <div>
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck size={14} className="text-gold" />
            <span className="font-medium text-storm">
              {product.category || "Asad's Collection"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {product.name[locale]}
          </h1>

          {/* Rating row */}
          <div className="mt-3 flex items-center gap-3">
            {reviewCount > 0 ? (
              <>
                <StarRatingDisplay rating={avgRating} size={16} />
                <span className="text-sm font-medium text-ink">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-storm">
                  ({reviewCount} {t.product.reviews.toLowerCase()})
                </span>
              </>
            ) : (
              <span className="text-xs text-storm/60">{t.product.noReviews}</span>
            )}
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3 font-mono">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayPrice}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-bold text-deep"
              >
                {variantMode && !combinationIsValid
                  ? "—"
                  : formatPKR(displayPrice)}
              </motion.span>
            </AnimatePresence>
            {combinationIsValid && displayCompareAtPrice && displayCompareAtPrice > displayPrice && (
              <span className="text-base text-storm line-through">
                {formatPKR(displayCompareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink/80">
            {product.description[locale]}
          </p>

          {/* Stock + SKU */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock
                  ? "bg-green-50 text-green-700"
                  : combinationIsValid && overallInStock
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  inStock ? "bg-green-600" : combinationIsValid && overallInStock ? "bg-amber-600" : "bg-red-600"
                }`}
              />
              {variantMode && !combinationIsValid
                ? "Combination not available"
                : inStock
                ? t.product.inStock
                : combinationIsValid && overallInStock
                ? t.product.variantOutOfStock
                : t.product.outOfStock}
              {variantMode && combinationIsValid && inStock && displayStock <= 10 && displayStock > 0 && (
                <span className="opacity-80">· {displayStock} left</span>
              )}
            </span>
            {displaySku && (
              <span className="font-mono text-xs text-storm">SKU: {displaySku}</span>
            )}
          </div>

          {/* Variant pickers */}
          {variantMode && optionNames.length > 0 && (
            <div className="mt-6 space-y-5">
              {optionNames.map((optName) => {
                const values = getOptionValues(product, optName, selectedOptions);
                return (
                  <div key={optName}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">
                      {optName}
                      {selectedOptions[optName] && (
                        <span className="ml-2 font-mono text-deep">· {selectedOptions[optName]}</span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {values.map(({ value, inStock: optInStock }) => {
                        const isSelected = selectedOptions[optName] === value;
                        return (
                          <button
                            key={value}
                            disabled={!optInStock}
                            onClick={() => handleSelectOption(optName, value)}
                            className={`focus-ring rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                              isSelected
                                ? "border-deep bg-deep text-white"
                                : optInStock
                                ? "border-mist-dark text-ink hover:border-deep"
                                : "cursor-not-allowed border-mist-dark text-storm/40 line-through"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Single-variant dropdown */}
          {variantMode && optionNames.length === 0 && variants.length > 1 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">
                {t.product.size}
              </h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock <= 0}
                    onClick={() => handleSelectVariant(v.id)}
                    className={`focus-ring rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                      selectedVariantId === v.id
                        ? "border-deep bg-deep text-white"
                        : v.stock > 0
                        ? "border-mist-dark text-ink hover:border-deep"
                        : "cursor-not-allowed border-mist-dark text-storm/40 line-through"
                    }`}
                  >
                    {v.label || formatVariantLabel(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legacy size/color */}
          {!variantMode && product.sizes && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">{t.product.size}</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.value}
                    disabled={!s.inStock}
                    onClick={() => setSize(s.value)}
                    className={`focus-ring rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
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

          {!variantMode && product.colors && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-storm">{t.product.color}</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
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

          {/* Quantity + Actions */}
          <div className="mt-6 flex items-center gap-4">
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-mist-dark pt-5">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck size={18} className="text-deep" />
              <span className="text-[10px] font-medium text-storm">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <ShieldCheck size={18} className="text-deep" />
              <span className="text-[10px] font-medium text-storm">Quality Checked</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <BadgeCheck size={18} className="text-deep" />
              <span className="text-[10px] font-medium text-storm">COD Available</span>
            </div>
          </div>

          {/* Features */}
          {product.features.length > 0 && (
            <div className="mt-6 border-t border-mist-dark pt-5">
              <h3 className="mb-3 font-display text-sm font-bold text-ink">{t.product.features}</h3>
              <ul className="space-y-2">
                {product.features.map((f) => (
                  <li key={f.en} className="flex items-start gap-2 text-sm text-ink/80">
                    <Check size={14} className="mt-0.5 shrink-0 text-gold" />
                    {f[locale]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ===== Reviews Section ===== */}
      <div className="mt-16 border-t border-mist-dark pt-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              {t.product.reviews}
            </h2>
            {reviewCount > 0 ? (
              <p className="mt-1 text-sm text-storm">
                {t.product.basedOn} {reviewCount} {t.product.reviews.toLowerCase()}
              </p>
            ) : (
              <p className="mt-1 text-sm text-storm">{t.product.noReviews}</p>
            )}
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="focus-ring flex items-center gap-2 rounded-full border border-mist-dark px-5 py-2.5 text-sm font-semibold text-deep transition-colors hover:bg-mist"
          >
            <MessageSquare size={15} />
            {t.product.writeReview}
          </button>
        </div>

        {/* Rating summary + distribution */}
        {reviewCount > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-8 rounded-2xl border border-mist-dark bg-mist/30 p-6 sm:grid-cols-[200px_1fr]">
            <div className="text-center sm:border-r sm:border-mist-dark sm:pr-6">
              <div className="font-display text-5xl font-extrabold text-deep">
                {avgRating.toFixed(1)}
              </div>
              <div className="mt-2 flex justify-center">
                <StarRatingDisplay rating={avgRating} size={18} />
              </div>
              <p className="mt-2 text-xs text-storm">{reviewCount} reviews</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star - 1];
                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="flex w-12 items-center gap-1 text-xs font-medium text-storm">
                      {star} <Star size={11} className="fill-gold text-gold" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist-dark">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gold"
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-storm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual reviews */}
        {reviews.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-mist-dark bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <StarRatingDisplay rating={r.rating} size={14} />
                  {r.verifiedPurchase && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">
                      {t.product.verifiedPurchase}
                    </span>
                  )}
                </div>
                {r.title && (
                  <p className="mt-2 text-sm font-bold text-ink">{r.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-ink/80">{r.comment}</p>
                <div className="mt-3 flex items-center justify-between border-t border-mist-dark pt-3">
                  <p className="text-xs font-semibold text-storm">{r.customerName}</p>
                  <p className="text-[10px] text-storm/60">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Related ===== */}
      {related.length > 0 && (
        <div className="mt-16 border-t border-mist-dark pt-10">
          <h2 className="mb-6 font-display text-xl font-bold text-ink">{t.product.related}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* ===== Review Modal ===== */}
      <AnimatePresence>
        {showReviewModal && (
          <ReviewModal
            product={product}
            onClose={() => setShowReviewModal(false)}
            onSubmitted={() => {
              setShowReviewModal(false);
              // Reviews won't appear immediately (they need admin approval),
              // but we could show a success state.
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- Review submission modal -----
function ReviewModal({
  product,
  onClose,
  onSubmitted,
}: {
  product: Product;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating < 1 || rating > 5) {
      setError(t.product.ratingRequired);
      return;
    }
    if (comment.trim().length < 10) {
      setError("Please write a review of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          slug: product.slug,
          customerName: name,
          customerEmail: email || undefined,
          customerPhone: phone || undefined,
          rating,
          title: title || undefined,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      setSuccess(true);
      setTimeout(() => onSubmitted(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-mist-dark px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">{t.product.writeReview}</h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-full p-1.5 hover:bg-mist"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-ink">{t.product.reviewSubmitted}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Rating */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-storm">
                Rating <span className="text-red-400">*</span>
              </label>
              <StarRatingInput value={rating} onChange={setRating} size={28} />
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-storm">
                {t.product.yourName} <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-ring w-full rounded-xl border border-mist-dark px-4 py-2.5 text-sm"
                placeholder="Your name"
              />
            </div>

            {/* Email + Phone */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.product.yourEmail}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-ring w-full rounded-xl border border-mist-dark px-4 py-2.5 text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.product.yourPhone}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="focus-ring w-full rounded-xl border border-mist-dark px-4 py-2.5 text-sm"
                  placeholder="03xx-xxxxxxx"
                />
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-storm">
                {t.product.reviewTitle}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="focus-ring w-full rounded-xl border border-mist-dark px-4 py-2.5 text-sm"
                placeholder="Summarize your experience"
              />
            </div>

            {/* Comment */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold text-storm">
                {t.product.yourReview} <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="focus-ring w-full rounded-xl border border-mist-dark px-4 py-2.5 text-sm"
                placeholder="Share details about the product quality, delivery, etc."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-deep py-3.5 text-sm font-bold text-white transition-colors hover:bg-deep-light disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {t.product.submitReview}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
