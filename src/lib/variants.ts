import { Product, ProductVariant } from "@/types/product";

/**
 * Variant + price helpers — single source of truth for deriving display
 * price, display stock, display images, etc. Used by ProductDetailClient,
 * ProductCard, ShopClient and the order API so the same logic never
 * drifts between admin, storefront and checkout.
 */

export function hasVariants(product: Pick<Product, "variants">): boolean {
  return Array.isArray(product.variants) && product.variants.length > 0;
}

/** Active variants only — admin can soft-disable a variant without deleting it. */
export function activeVariants(product: Pick<Product, "variants">): ProductVariant[] {
  return (product.variants || []).filter((v) => v.active);
}

/** Minimum price across active variants. Falls back to product.price for
 *  legacy / simple products. Used by product cards, sorting and SEO. */
export function getDisplayPrice(product: Product): number {
  const variants = activeVariants(product);
  if (variants.length === 0) return product.price;
  // Prefer the minimum price among variants that actually have stock, so
  // we never advertise a "From Rs. X" price that is completely unavailable.
  // Only fall back to all-variant min if every variant is out of stock.
  const inStock = variants.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : variants;
  const min = Math.min(...pool.map((v) => v.price));
  return Number.isFinite(min) ? min : product.price;
}

/** Maximum price across active variants that have stock — used for
 *  AggregateOffer highPrice. Falls back to all-active-variants max if
 *  every variant is out of stock. */
export function getMaxVariantPrice(product: Product): number | undefined {
  const variants = activeVariants(product);
  if (variants.length === 0) return undefined;
  const inStock = variants.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : variants;
  return Math.max(...pool.map((v) => v.price));
}

/** Compare-at price for the "From" display on cards — minimum compareAt
 *  across in-stock variants whose compareAtPrice is set, else all-active
 *  variants, else product.compareAtPrice. */
export function getDisplayCompareAtPrice(product: Product): number | undefined {
  const variants = activeVariants(product);
  if (variants.length === 0) return product.compareAtPrice;
  const inStock = variants.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : variants;
  const withCompare = pool.filter((v) => v?.compareAtPrice);
  if (withCompare.length === 0) return product.compareAtPrice;
  return Math.min(...withCompare.map((v) => v.compareAtPrice as number));
}

/** True if any active variant is in stock. For legacy products, falls back
 *  to product.stock > 0. */
export function isProductInStock(product: Product): boolean {
  const variants = activeVariants(product);
  if (variants.length === 0) return product.stock > 0;
  return variants.some((v) => v.stock > 0);
}

/** Find a variant by id. Returns undefined if not found. */
export function findVariant(product: Product, variantId?: string): ProductVariant | undefined {
  if (!variantId) return undefined;
  return (product.variants || []).find((v) => v.id === variantId);
}

/** Default variant — first active variant with stock, else first active. */
export function getDefaultVariant(product: Product): ProductVariant | undefined {
  const variants = activeVariants(product);
  if (variants.length === 0) return undefined;
  return variants.find((v) => v.stock > 0) || variants[0];
}

/** Find a variant by its options combination. Used when the customer picks
 *  option buttons (Volume=50ml, Bottle=Gold) — we look up the matching
 *  variant and switch to it. */
export function findVariantByOptions(
  product: Product,
  selectedOptions: Record<string, string>
): ProductVariant | undefined {
  const variants = activeVariants(product);
  const keys = Object.keys(selectedOptions);
  if (keys.length === 0) return undefined;
  return variants.find((v) => {
    return keys.every((k) => v.options?.[k] === selectedOptions[k]);
  });
}

/** Find the variant that owns a given image URL. Used by the product
 *  gallery: when the customer clicks an image, we auto-switch to the
 *  variant that image belongs to (Feature 5). */
export function findVariantByImage(
  product: Product,
  imageUrl: string
): ProductVariant | undefined {
  const variants = activeVariants(product);
  return variants.find((v) => Array.isArray(v.images) && v.images.includes(imageUrl));
}

/** Images to display in the gallery. Includes variant-specific images
 *  (deduped) plus the general product images, in this order:
 *    1. selected variant's images (if any)
 *    2. other variants' images
 *    3. general product images not already included
 *  For legacy products, just returns product.images. */
export function getGalleryImages(product: Product, selectedVariantId?: string): string[] {
  if (!hasVariants(product)) return product.images || [];
  const variants = activeVariants(product);
  const ordered: string[] = [];
  const seen = new Set<string>();

  const push = (url: string | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    ordered.push(url);
  };

  // Selected variant's images first
  const selected = findVariant(product, selectedVariantId);
  if (selected?.images) selected.images.forEach(push);

  // Then other variants
  for (const v of variants) {
    if (v.id === selectedVariantId) continue;
    v.images?.forEach(push);
  }

  // Then general product images (these act as "shared" images not tied
  // to a specific variant — e.g. lifestyle / packaging shots)
  product.images?.forEach(push);

  return ordered;
}

/** Build a human-readable label for a variant, e.g. "Large / Black" or
 *  "50ml" if only one option. Falls back to the variant's own label. */
export function formatVariantLabel(variant: ProductVariant): string {
  const optionValues = Object.values(variant.options || {});
  if (optionValues.length > 0) return optionValues.join(" / ");
  return variant.label;
}

/** All distinct option names across all variants — e.g. ["Volume", "Bottle"].
 *  Drives the option picker UI on the product detail page. */
export function getOptionNames(product: Product): string[] {
  const variants = activeVariants(product);
  const names = new Set<string>();
  variants.forEach((v) => {
    Object.keys(v.options || {}).forEach((k) => names.add(k));
  });
  return Array.from(names);
}

/** All distinct values for a given option name, with in-stock flag.
 *  A value is considered available if at least one variant with that
 *  value has stock > 0. */
export function getOptionValues(
  product: Product,
  optionName: string,
  selectedOptions: Record<string, string> = {}
): { value: string; inStock: boolean }[] {
  const variants = activeVariants(product);
  const valueMap = new Map<string, boolean>();
  for (const v of variants) {
    const value = v.options?.[optionName];
    if (!value) continue;
    // For combined-variant products (Volume + Bottle), only consider
    // variants that match the currently selected other options.
    const matchesOtherSelections = Object.entries(selectedOptions).every(
      ([k, val]) => k === optionName || v.options?.[k] === val
    );
    if (!matchesOtherSelections) continue;
    const currentlyInStock = valueMap.get(value) ?? false;
    valueMap.set(value, currentlyInStock || v.stock > 0);
  }
  return Array.from(valueMap.entries()).map(([value, inStock]) => ({ value, inStock }));
}

/** Authoritative price for a cart line — looks up the product from the DB
 *  (server-side) and returns the variant's price if a variantId is set,
 *  else the product base price.
 *
 *  WARNING: This is the LENIENT resolver kept for backwards-compatible
 *  call sites. The order API must use `resolveOrderLine()` below, which
 *  enforces the full security rules (variantId required for variant
 *  products, active check, zero-stock rejection). */
export function resolveAuthoritativePrice(
  product: Product,
  variantId?: string
): { price: number; compareAtPrice?: number; stock: number; sku?: string } {
  if (!variantId) {
    return {
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      sku: product.sku,
    };
  }
  const variant = findVariant(product, variantId);
  if (!variant) {
    throw new Error(
      `Variant ${variantId} not found on product ${product.id} (${product.slug})`
    );
  }
  return {
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    stock: variant.stock,
    sku: variant.sku || product.sku,
  };
}

/** Result of a strict order-line resolution. */
export interface ResolvedOrderLine {
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  variant?: ProductVariant;
  /** Authoritative image URL for this line — variant's first image if a
   *  variant is selected, else the product's primary image. */
  image: string;
  variantLabel: string;
  selectedOptions: Record<string, string>;
}

/**
 * STRICT order-line resolver — used by /api/orders to enforce every
 * server-side security rule from the hardening spec:
 *
 *   1. A product is considered a "variant product" when it has ANY
 *      variants in its `variants` array — regardless of whether those
 *      variants are active or inactive. We NEVER fall back to
 *      `product.price`/`product.stock` for a variant product, even if
 *      every variant is inactive.
 *   2. If the product is a variant product, a valid `variantId` is REQUIRED.
 *   3. The variant must exist on this exact product.
 *   4. The variant must be active (inactive variants cannot be purchased).
 *   5. The variant must have stock > 0 (zero-stock variants rejected).
 *   6. Requested quantity must not exceed available stock.
 *   7. Price, image, label, options and SKU are always read from the DB —
 *      client-supplied values are ignored.
 *
 *  For legacy/simple products (no variants array at all), uses product.price/stock.
 *
 *  Throws an Error with a user-facing message if any rule is violated.
 */
export function resolveOrderLine(
  product: Product,
  variantId: string | undefined,
  quantity: number
): ResolvedOrderLine {
  // A product is a "variant product" if it has ANY variants in the array
  // — active OR inactive. This is critical: if we used activeVariants()
  // here, a product whose variants are all inactive would be treated as a
  // simple product and fall back to product.price, which would let a
  // customer buy it at the base price even though every real variant is
  // disabled. That must never happen.
  const productHasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const active = activeVariants(product);

  // ---- Variant product path ----
  if (productHasVariants) {
    // If the product has variants but NONE are active, reject every
    // purchase attempt — whether or not a variantId was supplied.
    if (active.length === 0) {
      throw new Error(
        `"${product.name.en}" is currently unavailable.`
      );
    }
    if (!variantId) {
      throw new Error(
        `Please select a variant for "${product.name.en}".`
      );
    }
    // Search ACTIVE variants only — an inactive variant id must be rejected
    // even if it exists on the product.
    const variant = active.find((v) => v.id === variantId);
    if (!variant) {
      // Either the id doesn't exist on this product at all, or it belongs
      // to an inactive variant. Either way, reject.
      throw new Error(
        `The selected variant is no longer available for "${product.name.en}".`
      );
    }
    // Zero-stock rejection — explicit, no `stock > 0 &&` shortcut.
    if (variant.stock <= 0) {
      throw new Error(
        `"${product.name.en}" (${formatVariantLabel(variant)}) is out of stock.`
      );
    }
    // Quantity vs stock.
    if (quantity > variant.stock) {
      throw new Error(
        `Only ${variant.stock} unit(s) of "${product.name.en}" (${formatVariantLabel(variant)}) are available.`
      );
    }
    const image = variant.images?.[0] || product.images?.[0] || "";
    return {
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      sku: variant.sku || product.sku,
      variant,
      image,
      variantLabel: formatVariantLabel(variant),
      selectedOptions: { ...(variant.options || {}) },
    };
  }

  // ---- Legacy / simple product path (no variants array at all) ----
  if (product.stock <= 0) {
    throw new Error(`"${product.name.en}" is out of stock.`);
  }
  if (quantity > product.stock) {
    throw new Error(
      `Only ${product.stock} unit(s) of "${product.name.en}" are available.`
    );
  }
  return {
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    sku: product.sku,
    variant: undefined,
    image: product.images?.[0] || "",
    variantLabel: "",
    selectedOptions: {},
  };
}

/** Normalize a slug from a name. Used for both product and category slugs. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
