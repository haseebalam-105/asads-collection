"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, X, Save, ImageIcon } from "lucide-react";
import { Product } from "@/types/product";

const suggestedCategories = [
  "Rain Coats",
  "Bike Covers",
  "Car Covers",
  "Home Protection",
];

type FormState = {
  nameEn: string;
  nameUr: string;
  slug: string;
  sku: string;
  category: string;
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
};

function toFormState(p?: Product): FormState {
  return {
    nameEn: p?.name.en || "",
    nameUr: p?.name.ur || "",
    slug: p?.slug || "",
    sku: p?.sku || "",
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
  };
}

const sectionClass = "rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm";
const labelClass = "mb-1.5 block text-xs font-semibold text-storm";
const inputClass =
  "focus-ring w-full rounded-xl border border-mist-dark bg-white px-4 py-2.5 text-sm transition-all duration-200 hover:border-storm/40 focus:border-deep";

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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      update("images", [...form.images, data.url]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Partial<Product> = {
      name: { en: form.nameEn, ur: form.nameUr || form.nameEn },
      slug: form.slug || form.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: form.sku,
      category: form.category,
      shortDescription: { en: form.shortDescEn, ur: form.shortDescEn },
      description: { en: form.descEn, ur: form.descEn },
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
      images: form.images,
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
        <div className="rounded-2xl bg-red-50 px-5 py-3.5 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

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
          <div>
            <label className={labelClass}>Category</label>
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. Rain Coats, Bike Covers, Car Covers…"
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-storm/70">
              Suggestions: {suggestedCategories.join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-6">
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
      </section>

      <section className={sectionClass}>
        <h2 className="mb-5 font-display text-sm font-bold text-ink">Variants</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Sizes (comma separated)</label>
            <input
              value={form.sizesText}
              onChange={(e) => update("sizesText", e.target.value)}
              placeholder="S, M, L, XL"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Colours (comma separated)</label>
            <input
              value={form.colorsText}
              onChange={(e) => update("colorsText", e.target.value)}
              placeholder="Black, Blue"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-5 font-display text-sm font-bold text-ink">Images</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          {form.images.map((url) => (
            <div key={url} className="group relative h-28 w-28 overflow-hidden rounded-2xl border border-mist-dark/60 bg-mist">
              <Image src={url} alt="" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors group-hover:bg-ink/30">
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100"
                >
                  <X size={14} />
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
            <span className="text-[10px] font-semibold">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        <p className="text-xs text-storm/60">
          Uploads go to Cloudinary — requires CLOUDINARY_* env vars to be set.
        </p>
      </section>

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
    </form>
  );
}
