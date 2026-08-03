"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, Save } from "lucide-react";
import { Product } from "@/types/product";

const categories = [
  { value: "raincoats", label: "Rain Coats" },
  { value: "bike-covers", label: "Bike Covers" },
  { value: "car-covers", label: "Car Covers" },
  { value: "home-protection", label: "Home Protection" },
];

type FormState = {
  nameEn: string;
  nameUr: string;
  slug: string;
  sku: string;
  category: Product["category"];
  shortDescEn: string;
  descEn: string;
  price: number;
  compareAtPrice: number | "";
  stock: number;
  isFeatured: boolean;
  images: string[];
  sizesText: string; // comma separated
  colorsText: string; // comma separated
  featuresText: string; // one per line
};

function toFormState(p?: Product): FormState {
  return {
    nameEn: p?.name.en || "",
    nameUr: p?.name.ur || "",
    slug: p?.slug || "",
    sku: p?.sku || "",
    category: p?.category || "raincoats",
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
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Basic Info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Name (English) *</label>
            <input
              required
              value={form.nameEn}
              onChange={(e) => update("nameEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Name (Urdu)</label>
            <input
              dir="rtl"
              value={form.nameUr}
              onChange={(e) => update("nameUr", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto-generated from name if left blank"
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Category</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as Product["category"])}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
              className="h-4 w-4 accent-deep"
            />
            <label htmlFor="featured" className="text-sm text-ink">
              Show on homepage (Featured)
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Description</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Short Description</label>
            <input
              value={form.shortDescEn}
              onChange={(e) => update("shortDescEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Full Description</label>
            <textarea
              rows={4}
              value={form.descEn}
              onChange={(e) => update("descEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">
              Features (one per line)
            </label>
            <textarea
              rows={4}
              value={form.featuresText}
              onChange={(e) => update("featuresText", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Pricing & Stock</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Price (PKR) *</label>
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">
              Compare-at Price (PKR)
            </label>
            <input
              type="number"
              min={0}
              value={form.compareAtPrice}
              onChange={(e) =>
                update("compareAtPrice", e.target.value === "" ? "" : Number(e.target.value))
              }
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Stock Quantity</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => update("stock", Number(e.target.value))}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Variants</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">
              Sizes (comma separated)
            </label>
            <input
              value={form.sizesText}
              onChange={(e) => update("sizesText", e.target.value)}
              placeholder="S, M, L, XL"
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">
              Colours (comma separated)
            </label>
            <input
              value={form.colorsText}
              onChange={(e) => update("colorsText", e.target.value)}
              placeholder="Black, Blue"
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Images</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          {form.images.map((url) => (
            <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-lg bg-mist">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-mist-dark text-storm hover:border-deep hover:text-deep">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-[10px] font-semibold">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        <p className="text-xs text-storm">
          Uploads go to Cloudinary — requires CLOUDINARY_* env vars to be set.
        </p>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="focus-ring flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {productId ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
