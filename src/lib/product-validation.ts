import { Product, ProductVariant } from "@/types/product";

/**
 * Shared product validation — used by both POST /api/admin/products and
 * PUT /api/admin/products/[id] so CREATE and UPDATE enforce the same rules.
 *
 * Returns an error message string, or null if the payload is valid.
 */
export function validateProductPayload(body: Partial<Product>): string | null {
  if (!body.name?.en) return "Product name (English) is required.";
  if (!body.slug) return "Slug is required.";
  if (body.price == null || body.price < 0) return "Price must be 0 or greater.";
  if (body.stock != null && body.stock < 0) return "Stock must be 0 or greater.";
  if (body.compareAtPrice != null && body.compareAtPrice < 0)
    return "Compare-at price must be 0 or greater.";

  // Validate images are URLs (Cloudinary or relative).
  if (body.images) {
    for (const url of body.images) {
      if (typeof url !== "string" || !isValidImageUrl(url)) {
        return `Invalid image URL: ${url}`;
      }
    }
  }

  // Validate variants if present.
  if (Array.isArray(body.variants) && body.variants.length > 0) {
    const seenIds = new Set<string>();
    const seenCombos = new Set<string>();
    for (const v of body.variants as ProductVariant[]) {
      // Variant ID required + unique within the product.
      if (!v.id) return "Each variant must have an id.";
      if (seenIds.has(v.id))
        return `Duplicate variant id: ${v.id}. Each variant must have a unique id.`;
      seenIds.add(v.id);

      // Must have a meaningful label or at least one option.
      const hasLabel = typeof v.label === "string" && v.label.trim().length > 0;
      const hasOptions =
        v.options && Object.keys(v.options).length > 0 &&
        Object.values(v.options).some((val) => typeof val === "string" && val.trim().length > 0);
      if (!hasLabel && !hasOptions)
        return "Each variant must have a label or at least one meaningful option value.";

      // Price + stock must be valid numbers.
      if (v.price == null || v.price < 0)
        return `Variant "${v.label || "Untitled"}" has an invalid price.`;
      if (v.stock == null || v.stock < 0)
        return `Variant "${v.label || "Untitled"}" has an invalid stock.`;
      if (v.compareAtPrice != null && v.compareAtPrice < 0)
        return `Variant "${v.label || "Untitled"}" has an invalid compare-at price.`;

      // Duplicate-detection key. If the variant has meaningful options,
      // uniqueness is based on the normalized option combination (so
      // Volume=50ml + Bottle=Gold can't appear twice). If the variant is
      // label-only (no options), uniqueness falls back to the normalized
      // label — so "Standard", "Premium", "Gift Edition" are all allowed,
      // but two variants both labelled "Standard" are rejected. This keeps
      // the two modes (options vs label) consistent: every variant must
      // have a unique identity within the product.
      const comboKey = buildVariantUniquenessKey(v);
      if (seenCombos.has(comboKey)) {
        const display = comboKey || "(empty)";
        return `Duplicate variant detected: ${display}. Each variant must have a unique option combination or label.`;
      }
      seenCombos.add(comboKey);

      // Validate variant image URLs.
      if (v.images) {
        for (const url of v.images) {
          if (typeof url !== "string" || !isValidImageUrl(url)) {
            return `Variant "${v.label || "Untitled"}" has an invalid image URL: ${url}`;
          }
        }
      }

      // SKU is optional but if provided must be a non-empty string.
      if (v.sku !== undefined && v.sku !== null) {
        if (typeof v.sku !== "string")
          return `Variant "${v.label || "Untitled"}" has an invalid SKU.`;
      }
    }
  }

  return null;
}

/**
 * Build a stable uniqueness key for a variant. If the variant has
 * meaningful options, the key is the sorted option combination (e.g.
 * `Bottle=Gold|Volume=50ml`). If the variant is label-only (no options
 * or all options empty), the key is the normalized label (lowercased +
 * trimmed). This ensures:
 *
 *   - Two variants with the same options → same key → duplicate rejected.
 *   - Two label-only variants with the same label → same key → rejected.
 *   - Label-only variants with different labels ("Standard", "Premium")
 *     → different keys → allowed.
 *   - A label-only variant and an options variant never collide (the
 *     `label::` vs `options::` prefix keeps them separate).
 */
export function buildVariantUniquenessKey(variant: ProductVariant): string {
  const optionsKey = buildOptionComboKey(variant.options);
  if (optionsKey) {
    return `options::${optionsKey}`;
  }
  // No meaningful options — fall back to normalized label.
  const normalizedLabel = (variant.label || "").trim().toLowerCase();
  return `label::${normalizedLabel}`;
}

/** Build a stable string key from a variant's options, so two variants
 *  with the same option combination produce the same key (for duplicate
 *  detection). Keys are sorted alphabetically so order doesn't matter.
 *  Returns an empty string if the variant has no meaningful options. */
export function buildOptionComboKey(options?: Record<string, string>): string {
  if (!options) return "";
  return Object.entries(options)
    .filter(([, val]) => typeof val === "string" && val.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, val]) => `${k}=${val}`)
    .join("|");
}

/** Valid image URL = http(s) Cloudinary URL or a relative path starting with /. */
export function isValidImageUrl(url: string): boolean {
  return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));
}
