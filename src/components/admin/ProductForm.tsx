"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  X,
  Save,
  ImageIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Product, ProductVariant, Category } from "@/types/product";
import { slugify } from "@/lib/variants";

interface FormState {
  nameEn: string;
  nameUr: string;
  slug: string;
  sku: string;
  categoryId: string;
  category: string; // legacy slug, kept in sync with the selected category
  shortDescEn: string;
  descEn: string;
  price: number;
  compareAtPrice: number | "";
  stock: number;
  isFeatured: boolean;
  images: string[];
  sizesText: string;
  colorsText: string;
  featuresText: string;
  productType: "simple" | "variants";
  variants: ProductVariant[];
}

function toFormState(p?: Product): FormState {
  const hasVariants = Array.isArray(p?.variants) && (p?.variants?.length ?? 0) > 0;
  return {
    nameEn: p?.name.en || "",
    nameUr: p?.name.ur || "",
    slug: p?.slug || "",
    sku: p?.sku || "",
    categoryId: p?.categoryId || "",
    category: p?.category || "",
    shortDescEn: p?.shortDescription.en || "",
    descEn: p?.description.en || "",
    price: p?.price || 0,
    compareAtPrice: p?.compareAtPrice ?? "",
    stock: p?.stock ?? 0,
    isFeatured: p?.isFeatured ?? false,
    images: p?.images || [],
    sizesText: p?.sizes?.map((s) => s.value).join(", ") || "",
    colorsText: p?.colors?.map((c) => c.value).join(", ") || "",
    featuresText: p?.features?.map((f) => f.en).join("\n") || "",
    productType: hasVariants ? "variants" : "simple",
    variants: p?.variants || [],
  };
}

const sectionClass = "rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm";
const labelClass = "mb-1.5 block text-xs font-semibold text-storm";
const inputClass =
  "focus-ring w-full rounded-xl border border-mist-dark bg-white px-4 py-2.5 text-sm transition-all duration-200 hover:border-storm/40 focus:border-deep";

const COMMON_OPTION_NAMES = [
  "Volume",
  "Size",
  "Color",
  "Style",
  "Material",
  "Pack",
  "Type",
  "Model",
  "Bottle",
  "Edition",
];

export default function ProductForm({
  product,
  productId,
}: {
  product?: Product;
  productId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(product));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showQuickCategory, setShowQuickCategory] = useState(false);

  // Fetch dynamic categories from MongoDB (via the admin API).
  const reloadCategories = () => {
    setLoadingCategories(true);
    return fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .finally(() => setLoadingCategories(false));
  };
  useEffect(() => {
    reloadCategories();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        newUrls.push(data.url);
      }
      update("images", [...form.images, ...newUrls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (url: string) => {
    update("images", form.images.filter((i) => i !== url));
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const next = [...form.images];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update("images", next);
  };

  // ---------- Variant builder ----------
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      label: "",
      options: {},
      price: form.price || 0,
      compareAtPrice: form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      stock: 0,
      sku: "",
      images: [],
      active: true,
    };
    update("variants", [...form.variants, newVariant]);
  };

  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    update(
      "variants",
      form.variants.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  };

  const removeVariant = (id: string) => {
    update("variants", form.variants.filter((v) => v.id !== id));
  };

  const moveVariant = (idx: number, direction: -1 | 1) => {
    const next = [...form.variants];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update("variants", next);
  };

  // Variant option editor: add/remove key-value pairs for a variant.
  const setVariantOption = (variantId: string, key: string, value: string) => {
    const v = form.variants.find((x) => x.id === variantId);
    if (!v) return;
    const opts = { ...(v.options || {}) };
    if (value.trim() === "") {
      delete opts[key];
    } else {
      opts[key] = value;
    }
    updateVariant(variantId, { options: opts });
  };

  const addVariantOption = (variantId: string) => {
    const v = form.variants.find((x) => x.id === variantId);
    if (!v) return;
    const opts = { ...(v.options || {}) };
    // Generate a unique placeholder key the admin can rename.
    let n = 1;
    while (opts[`Option ${n}`] !== undefined) n++;
    opts[`Option ${n}`] = "";
    updateVariant(variantId, { options: opts });
  };

  const removeVariantOption = (variantId: string, key: string) => {
    const v = form.variants.find((x) => x.id === variantId);
    if (!v) return;
    const opts = { ...(v.options || {}) };
    delete opts[key];
    updateVariant(variantId, { options: opts });
  };

  const renameVariantOption = (variantId: string, oldKey: string, newKey: string) => {
    const v = form.variants.find((x) => x.id === variantId);
    if (!v) return;
    const opts: Record<string, string> = {};
    for (const [k, val] of Object.entries(v.options || {})) {
      if (k === oldKey) opts[newKey] = val;
      else opts[k] = val;
    }
    updateVariant(variantId, { options: opts });
  };

  // Variant image upload — variant images are stored as Cloudinary URLs
  // inside the variant itself, so they can be linked to a specific option.
  const uploadVariantImage = async (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const v = form.variants.find((x) => x.id === variantId);
      if (!v) return;
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        newUrls.push(data.url);
      }
      updateVariant(variantId, { images: [...(v.images || []), ...newUrls] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const removeVariantImage = (variantId: string, url: string) => {
    const v = form.variants.find((x) => x.id === variantId);
    if (!v) return;
    updateVariant(variantId, {
      images: (v.images || []).filter((u) => u !== url),
    });
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validation
    if (!form.nameEn) {
      setError("Product name (English) is required.");
      setSaving(false);
      return;
    }
    if (form.productType === "variants") {
      if (form.variants.length === 0) {
        setError("Add at least one variant, or switch the product type to Simple.");
        setSaving(false);
        return;
      }
      // Each variant must have a label or at least one option.
      for (const v of form.variants) {
        const hasLabel = v.label.trim().length > 0;
        const hasOptions = Object.keys(v.options || {}).length > 0;
        if (!hasLabel && !hasOptions) {
          setError("Each variant needs a label or at least one option (e.g. Volume=50ml).");
          setSaving(false);
          return;
        }
        if (v.price < 0 || v.stock < 0) {
          setError(`Variant "${v.label || "Untitled"}" has a negative price or stock.`);
          setSaving(false);
          return;
        }
      }
      // Prevent duplicate variants — uses the SAME logic as the server-side
      // buildVariantUniquenessKey(): if a variant has meaningful options,
      // uniqueness is based on the option combination; if it's label-only
      // (no options), uniqueness falls back to the normalized label. This
      // allows "Standard", "Premium", "Gift Edition" as label-only variants
      // but rejects two variants both labelled "Standard".
      const seen = new Set<string>();
      for (const v of form.variants) {
        // Build the option combination key (sorted, non-empty values only).
        const optionKey = Object.entries(v.options || {})
          .filter(([, val]) => typeof val === "string" && val.trim().length > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, val]) => `${k}=${val}`)
          .join("|");
        // If options exist, use them; otherwise fall back to normalized label.
        const key = optionKey
          ? `options::${optionKey}`
          : `label::${(v.label || "").trim().toLowerCase()}`;
        if (seen.has(key)) {
          setError(
            `Duplicate variant detected: ${optionKey || v.label || "(empty)"}. Each variant must have a unique option combination or label.`
          );
          setSaving(false);
          return;
        }
        seen.add(key);
      }
    }

    // Sync the legacy `category` slug from the selected category so old
    // filters continue to work until all products are migrated.
    const selectedCategory = categories.find((c) => c.id === form.categoryId);
    const legacyCategorySlug = selectedCategory?.slug || form.category;

    const payload: Partial<Product> = {
      name: { en: form.nameEn, ur: form.nameUr || form.nameEn },
      slug: form.slug || slugify(form.nameEn),
      sku: form.sku,
      categoryId: form.categoryId || undefined,
      category: legacyCategorySlug,
      shortDescription: { en: form.shortDescEn, ur: form.shortDescEn },
      description: { en: form.descEn, ur: form.descEn },
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
      images: form.images,
      // Keep legacy sizes/colors for backward compatibility. They're only
      // used by old products that don't have `variants` set.
      sizes: form.sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((value) => ({ value, inStock: true })),
      colors: form.colorsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((value) => ({ value, inStock: true })),
      features: form.featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((en) => ({ en, ur: en })),
      // Variants: only include if product type is "variants" AND at least
      // one variant exists. Otherwise we explicitly nullify the field so
      // legacy products stay legacy.
      variants:
        form.productType === "variants" && form.variants.length > 0
          ? form.variants.map((v) => ({
              ...v,
              // Auto-derive label from options if admin left it blank.
              label:
                v.label.trim() ||
                Object.values(v.options || {}).join(" / ") ||
                "Variant",
              images: v.images || [],
            }))
          : [],
    };

    try {
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-5 py-3.5 text-sm font-medium text-red-600">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Basic Information */}
      <section className={sectionClass}>
        <h2 className="mb-5 font-display text-sm font-bold text-ink">Basic Info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name (English) <span className="text-red-400">*</span></label>
            <input
              required
              value={form.nameEn}
              onChange={(e) => update("nameEn", e.target.value)}
              placeholder="Premium Waterproof Rain Suit"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Name (Urdu)</label>
            <input
              dir="rtl"
              value={form.nameUr}
              onChange={(e) => update("nameUr", e.target.value)}
              placeholder="پریمیم واٹر پروف رین سوٹ"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto-generated from name if left blank"
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="ARC-RS-001"
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <div className="flex items-center gap-2.5 pt-6 sm:col-span-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded accent-deep"
            />
            <label htmlFor="featured" className="text-sm text-ink">
              Show on homepage (Featured)
            </label>
          </div>
        </div>
      </section>

      {/* 2. Category — dynamic dropdown */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Category</h2>
          <button
            type="button"
            onClick={() => setShowQuickCategory(true)}
            className="focus-ring flex items-center gap-1 text-[11px] font-semibold text-deep hover:underline"
          >
            <Plus size={12} /> Add New Category
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Select Category</label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-xs text-storm">
                <Loader2 size={12} className="animate-spin" /> Loading categories…
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-deep">
                No categories yet.{" "}
                <button
                  type="button"
                  onClick={() => setShowQuickCategory(true)}
                  className="font-semibold underline"
                >
                  Create your first category
                </button>{" "}
                — it will appear here immediately.
              </div>
            ) : (
              <select
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className={inputClass}
              >
                <option value="">— Select a category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.en}
                    {c.name.ur && c.name.ur !== c.name.en ? ` · ${c.name.ur}` : ""}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1.5 text-[11px] leading-relaxed text-storm/70">
              Categories are managed in{" "}
              <Link href="/admin/categories" className="underline">Admin → Categories</Link>.
              New categories appear here immediately — no redeploy needed.
            </p>
          </div>
          <div>
            <label className={labelClass}>Legacy category slug (optional)</label>
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="auto-synced from the selected category"
              className={`${inputClass} font-mono text-xs`}
              disabled={!!form.categoryId}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-storm/70">
              Kept for backward compatibility with existing products. Auto-filled from the
              selected category.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Description */}
      <section className={sectionClass}>
        <h2 className="mb-5 font-display text-sm font-bold text-ink">Description</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Short Description</label>
            <input
              value={form.shortDescEn}
              onChange={(e) => update("shortDescEn", e.target.value)}
              placeholder="One-line summary for product cards"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea
              rows={4}
              value={form.descEn}
              onChange={(e) => update("descEn", e.target.value)}
              placeholder="Detailed product description…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Features (one per line)</label>
            <textarea
              rows={4}
              value={form.featuresText}
              onChange={(e) => update("featuresText", e.target.value)}
              placeholder={`100% waterproof fabric\nAdjustable hood\nBreathable material`}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* 4. Product Images — multi-upload, reorder, primary */}
      <section className={sectionClass}>
        <h2 className="mb-1 font-display text-sm font-bold text-ink">Product Images</h2>
        <p className="mb-4 text-xs text-storm/70">
          Upload multiple images — the first image is used on product cards. Drag using the
          arrows to reorder. Variant-specific images are configured in the Variants section below.
        </p>
        <div className="mb-4 flex flex-wrap gap-3">
          {form.images.map((url, idx) => (
            <div
              key={url}
              className={`group relative h-28 w-28 overflow-hidden rounded-2xl border bg-mist ${
                idx === 0 ? "border-deep ring-2 ring-deep/20" : "border-mist-dark/60"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-deep px-1.5 py-0.5 text-[9px] font-bold text-white">
                  MAIN
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-ink/0 transition-colors group-hover:bg-ink/40">
                <button
                  type="button"
                  onClick={() => moveImage(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-full bg-white/90 p-1 text-storm shadow transition-opacity hover:text-deep disabled:opacity-30 group-hover:opacity-100"
                  aria-label="Move left"
                >
                  <ChevronUp size={12} className="rotate-[-90deg]" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, 1)}
                  disabled={idx === form.images.length - 1}
                  className="rounded-full bg-white/90 p-1 text-storm shadow transition-opacity hover:text-deep disabled:opacity-30 group-hover:opacity-100"
                  aria-label="Move right"
                >
                  <ChevronDown size={12} className="rotate-[-90deg]" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="rounded-full bg-white/90 p-1 text-red-500 shadow transition-opacity hover:text-red-700 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
          <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-mist-dark text-storm transition-all hover:border-deep hover:bg-deep/5 hover:text-deep">
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ImageIcon size={20} />
            )}
            <span className="text-[10px] font-semibold">{uploading ? "Uploading…" : "Upload"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs text-storm/60">
          Uploads go to Cloudinary — requires CLOUDINARY_* env vars to be set.
        </p>
      </section>

      {/* 5. Product Type toggle */}
      <section className={sectionClass}>
        <h2 className="mb-1 font-display text-sm font-bold text-ink">Product Type</h2>
        <p className="mb-4 text-xs text-storm/70">
          Choose <strong>Simple</strong> for a single price/stock, or{" "}
          <strong>Variants</strong> for products with multiple options (e.g. 30ml/50ml/100ml,
          or Size + Color combinations) each with their own price.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update("productType", "simple")}
            className={`focus-ring rounded-xl border-2 p-4 text-left transition-all ${
              form.productType === "simple"
                ? "border-deep bg-deep/5"
                : "border-mist-dark hover:border-storm/40"
            }`}
          >
            <div className="text-sm font-bold text-ink">Simple Product</div>
            <div className="mt-1 text-xs text-storm">One price, one stock level</div>
          </button>
          <button
            type="button"
            onClick={() => update("productType", "variants")}
            className={`focus-ring rounded-xl border-2 p-4 text-left transition-all ${
              form.productType === "variants"
                ? "border-deep bg-deep/5"
                : "border-mist-dark hover:border-storm/40"
            }`}
          >
            <div className="text-sm font-bold text-ink">Product with Variants</div>
            <div className="mt-1 text-xs text-storm">Multiple options, each with own price/stock</div>
          </button>
        </div>
      </section>

      {/* 6. Pricing & Stock — only shown for simple products */}
      {form.productType === "simple" && (
        <section className={sectionClass}>
          <h2 className="mb-5 font-display text-sm font-bold text-ink">Pricing & Stock</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Price (PKR) <span className="text-red-400">*</span></label>
              <input
                required
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update("price", Number(e.target.value))}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Compare-at Price (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.compareAtPrice}
                onChange={(e) =>
                  update("compareAtPrice", e.target.value === "" ? "" : Number(e.target.value))
                }
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => update("stock", Number(e.target.value))}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Legacy Sizes & Colors (optional)</label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                value={form.sizesText}
                onChange={(e) => update("sizesText", e.target.value)}
                placeholder="Sizes: S, M, L, XL"
                className={inputClass}
              />
              <input
                value={form.colorsText}
                onChange={(e) => update("colorsText", e.target.value)}
                placeholder="Colors: Black, Blue"
                className={inputClass}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-storm/70">
              These are simple comma-separated lists, kept for backward compatibility. For
              real variant pricing, use the Variants builder above.
            </p>
          </div>
        </section>
      )}

      {/* 7. Variants — full variant builder */}
      {form.productType === "variants" && (
        <section className={sectionClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-ink">Variants</h2>
              <p className="mt-1 text-xs text-storm/70">
                Each variant has its own price, stock, SKU and (optionally) its own images.
                Customers can switch between variants and the price updates instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-deep px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-deep-light"
            >
              <Plus size={13} /> Add Variant
            </button>
          </div>

          {form.variants.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-mist-dark p-8 text-center">
              <p className="text-sm font-medium text-storm">No variants yet</p>
              <p className="mt-1 text-xs text-storm/60">
                Click &ldquo;Add Variant&rdquo; to create your first one (e.g. 30ml = Rs. 2,000).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {form.variants.map((v, idx) => (
                <VariantCard
                  key={v.id}
                  variant={v}
                  index={idx}
                  total={form.variants.length}
                  commonOptionNames={COMMON_OPTION_NAMES}
                  productImages={form.images}
                  onChange={(patch) => updateVariant(v.id, patch)}
                  onRemove={() => removeVariant(v.id)}
                  onMove={(dir) => moveVariant(idx, dir)}
                  onAddOption={() => addVariantOption(v.id)}
                  onRemoveOption={(key) => removeVariantOption(v.id, key)}
                  onRenameOption={(oldKey, newKey) => renameVariantOption(v.id, oldKey, newKey)}
                  onSetOption={(key, val) => setVariantOption(v.id, key, val)}
                  onUploadImage={(e) => uploadVariantImage(v.id, e)}
                  onRemoveImage={(url) => removeVariantImage(v.id, url)}
                />
              ))}
            </div>
          )}

          {form.variants.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-deep/5 px-4 py-3 text-xs text-deep">
              <LinkIcon size={13} className="mt-0.5 shrink-0" />
              <span>
                <strong>Tip:</strong> If you assign images to a variant, customers who click
                that image on the product page will automatically see that variant&apos;s price and
                stock. Variant images appear in the gallery alongside the general product images.
              </span>
            </div>
          )}
        </section>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="focus-ring flex items-center gap-2 rounded-xl bg-deep px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all duration-200 hover:bg-deep-light hover:shadow-deep/30 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {productId ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-mist-dark px-6 py-3.5 text-sm font-semibold text-storm transition-colors hover:bg-mist"
        >
          Cancel
        </button>
      </div>

      {showQuickCategory && (
        <QuickCategoryModal
          onClose={() => setShowQuickCategory(false)}
          onCreated={async (newCategoryId) => {
            // Reload the category list so the new one appears, then
            // auto-select it so the admin doesn't have to.
            await reloadCategories();
            update("categoryId", newCategoryId);
            setShowQuickCategory(false);
          }}
        />
      )}
    </form>
  );
}

// ---------- Quick category creation modal ----------
function QuickCategoryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (newCategoryId: string) => void;
}) {
  const [nameEn, setNameEn] = useState("");
  const [nameUr, setNameUr] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      setError("Category name (English) is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: nameEn.trim(),
          nameUr: nameUr.trim(),
          slug: slug.trim() || undefined,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create category");
      onCreated(data.category.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-mist-dark px-5 py-3.5">
          <h2 className="font-display text-sm font-bold text-ink">Add New Category</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-1.5 hover:bg-mist"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-storm">
                Name (English) <span className="text-red-400">*</span>
              </label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Perfumes"
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-storm">Name (Urdu)</label>
              <input
                dir="rtl"
                value={nameUr}
                onChange={(e) => setNameUr(e.target.value)}
                placeholder="پرفیومز"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-storm">Slug (optional)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from name"
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-deep px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-deep-light disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Create & Select
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-mist-dark px-4 py-2.5 text-xs font-semibold text-storm transition-colors hover:bg-mist"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Variant card sub-component ----------
function VariantCard({
  variant,
  index,
  total,
  commonOptionNames,
  productImages,
  onChange,
  onRemove,
  onMove,
  onAddOption,
  onRemoveOption,
  onRenameOption,
  onSetOption,
  onUploadImage,
  onRemoveImage,
}: {
  variant: ProductVariant;
  index: number;
  total: number;
  commonOptionNames: string[];
  productImages: string[];
  onChange: (patch: Partial<ProductVariant>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddOption: () => void;
  onRemoveOption: (key: string) => void;
  onRenameOption: (oldKey: string, newKey: string) => void;
  onSetOption: (key: string, val: string) => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    try {
      await onUploadImage(e);
    } finally {
      setUploading(false);
    }
  };

  // Pick from existing product images to attach to this variant.
  const toggleProductImage = (url: string) => {
    const current = variant.images || [];
    if (current.includes(url)) {
      onChange({ images: current.filter((u) => u !== url) });
    } else {
      onChange({ images: [...current, url] });
    }
  };

  return (
    <div className="rounded-xl border border-mist-dark/60 bg-mist/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-deep text-[10px] font-bold text-white">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-ink">
            {variant.label || Object.values(variant.options || {}).join(" / ") || "New Variant"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-lg p-1.5 text-storm hover:bg-mist disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-lg p-1.5 text-storm hover:bg-mist disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-storm hover:bg-red-50 hover:text-red-500"
            aria-label="Remove variant"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-semibold text-storm">Label</label>
          <input
            value={variant.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. 50ml or Large / Black"
            className={`${inputClass} text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-storm">Price (PKR) *</label>
          <input
            type="number"
            min={0}
            value={variant.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-storm">Compare-at</label>
          <input
            type="number"
            min={0}
            value={variant.compareAtPrice ?? ""}
            onChange={(e) =>
              onChange({
                compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-storm">Stock</label>
          <input
            type="number"
            min={0}
            value={variant.stock}
            onChange={(e) => onChange({ stock: Number(e.target.value) })}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-storm">SKU</label>
          <input
            value={variant.sku || ""}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="PERF-50ML"
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id={`active-${variant.id}`}
            checked={variant.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="h-4 w-4 rounded accent-deep"
          />
          <label htmlFor={`active-${variant.id}`} className="text-xs text-ink">
            Active
          </label>
        </div>
      </div>

      {/* Options */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-storm">
            Options
          </span>
          <button
            type="button"
            onClick={onAddOption}
            className="flex items-center gap-1 text-[11px] font-semibold text-deep hover:underline"
          >
            <Plus size={11} /> Add option
          </button>
        </div>
        {Object.keys(variant.options || {}).length === 0 ? (
          <p className="text-[11px] text-storm/60">
            No options yet. Add one like <code className="rounded bg-mist px-1">Volume = 50ml</code>.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(variant.options || {}).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <input
                  list="variant-option-names"
                  value={key}
                  onChange={(e) => onRenameOption(key, e.target.value)}
                  className={`${inputClass} text-[11px]`}
                  placeholder="Option name"
                />
                <span className="text-storm">=</span>
                <input
                  value={val}
                  onChange={(e) => onSetOption(key, e.target.value)}
                  className={`${inputClass} text-[11px]`}
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={() => onRemoveOption(key)}
                  className="rounded p-1 text-storm hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove option"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        <datalist id="variant-option-names">
          {commonOptionNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      {/* Variant images */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-storm">
            Variant Images
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImagePicker((v) => !v)}
              className="text-[11px] font-semibold text-deep hover:underline"
            >
              {showImagePicker ? "Hide picker" : "Pick from product images"}
            </button>
            <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-deep hover:underline">
              {uploading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {(variant.images || []).length === 0 ? (
          <p className="text-[11px] text-storm/60">
            No variant images. The variant will use the general product images.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(variant.images || []).map((url) => (
              <div
                key={url}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-mist-dark/60 bg-mist"
              >
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100"
                  aria-label="Remove variant image"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showImagePicker && productImages.length > 0 && (
          <div className="mt-2 rounded-lg border border-mist-dark bg-white p-2">
            <p className="mb-1.5 text-[10px] font-semibold text-storm">
              Click to attach / detach a product image to this variant:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {productImages.map((url) => {
                const selected = (variant.images || []).includes(url);
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => toggleProductImage(url)}
                    className={`relative h-12 w-12 overflow-hidden rounded-md border-2 transition-all ${
                      selected ? "border-deep ring-1 ring-deep" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                    {selected && (
                      <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-bl bg-deep text-[7px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
