"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
  Loader2,
  X,
  ArrowRight,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { Category } from "@/types/product";

interface CategoryWithCount extends Category {
  productCount?: number;
}

type FormState = {
  nameEn: string;
  nameUr: string;
  slug: string;
  descEn: string;
  descUr: string;
  image: string;
  active: boolean;
};

const empty: FormState = {
  nameEn: "",
  nameUr: "",
  slug: "",
  descEn: "",
  descUr: "",
  image: "",
  active: true,
};

const sectionClass = "rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm";
const labelClass = "mb-1.5 block text-xs font-semibold text-storm";
const inputClass =
  "focus-ring w-full rounded-xl border border-mist-dark bg-white px-4 py-2.5 text-sm transition-all duration-200 hover:border-storm/40 focus:border-deep";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCategories(data.categories || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (cat: CategoryWithCount) => {
    if (!confirm(`Delete category "${cat.name.en}"?`)) return;
    // Try plain delete; if it has products, the API will tell us and we
    // prompt for a reassign target.
    const res = await fetch(`/api/admin/categories/${cat.id}?reassignTo=`, {
      method: "DELETE",
    }).then((r) => r.json());

    if (res.code === "HAS_PRODUCTS") {
      const others = categories.filter((c) => c.id !== cat.id);
      if (others.length === 0) {
        alert(
          `This category has ${res.productCount} product(s). Create another category first, then come back and delete this one — the products need somewhere to go.`
        );
        return;
      }
      const targetName = prompt(
        `This category has ${res.productCount} product(s). Type the name of another category to move them to:\n\n${others
          .map((c) => `- ${c.name.en}`)
          .join("\n")}`
      );
      if (!targetName) return;
      const target = others.find(
        (c) => c.name.en.toLowerCase() === targetName.trim().toLowerCase()
      );
      if (!target) {
        alert("No matching category found. Delete cancelled.");
        return;
      }
      const res2 = await fetch(
        `/api/admin/categories/${cat.id}?reassignTo=${target.id}`,
        { method: "DELETE" }
      ).then((r) => r.json());
      if (res2.error) {
        alert(res2.error);
        return;
      }
      alert(`Moved ${res2.movedProducts} product(s) to ${target.name.en}, then deleted the category.`);
    } else if (res.error) {
      alert(res.error);
    } else {
      alert(`Deleted category "${cat.name.en}".`);
    }
    load();
  };

  const filtered = search.trim()
    ? categories.filter(
        (c) =>
          c.name.en.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">Categories</h1>
          <p className="mt-1 text-sm text-storm">
            Manage product categories — admin-created categories appear on the storefront immediately.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="focus-ring flex items-center gap-2 rounded-xl bg-deep px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-deep/20 transition-all hover:bg-deep-light hover:shadow-deep/30"
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-storm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="focus-ring w-full rounded-xl border border-mist-dark py-2.5 pl-10 pr-4 text-sm transition-colors hover:border-storm/40 focus:border-deep"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/5 to-gold/10 p-8 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
              <Tag size={20} className="text-gold-deep" />
            </div>
            <div>
              <p className="font-semibold text-deep">Database not connected</p>
              <p className="mt-0.5 text-storm">{error}</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-3 text-sm text-storm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-deep border-t-transparent" />
          Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mist-dark/60 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark bg-mist/50 text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Slug</th>
                <th className="px-5 py-3.5 font-semibold">Products</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-mist-dark/50 last:border-0 transition-colors hover:bg-mist/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-mist ring-1 ring-mist-dark/40">
                        {c.image ? (
                          <Image src={c.image} alt={c.name.en} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-storm/40">
                            <Tag size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{c.name.en}</p>
                        {c.name.ur && c.name.ur !== c.name.en && (
                          <p dir="rtl" className="text-[11px] text-storm">{c.name.ur}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-storm">{c.slug}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-mist px-2.5 py-1 text-xs font-medium text-ink/70">
                      {c.productCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {c.active ? (
                      <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-lg bg-mist px-2.5 py-1 text-xs font-semibold text-storm">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/shop?category=${c.slug}`}
                        target="_blank"
                        className="rounded-lg p-2 text-storm transition-colors hover:bg-mist hover:text-deep"
                        aria-label="View on storefront"
                        title="View on storefront"
                      >
                        <ArrowRight size={15} />
                      </Link>
                      <button
                        onClick={() => {
                          setEditing(c);
                          setShowForm(true);
                        }}
                        className="rounded-lg p-2 text-storm transition-colors hover:bg-mist hover:text-deep"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="rounded-lg p-2 text-storm transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-storm">
                    <Tag size={32} className="mx-auto mb-3 text-mist-dark" />
                    <p className="font-medium">No categories found</p>
                    <p className="mt-1 text-xs">Create your first category to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CategoryFormModal
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: CategoryWithCount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          nameEn: initial.name.en,
          nameUr: initial.name.ur || "",
          slug: initial.slug,
          descEn: initial.description?.en || "",
          descUr: initial.description?.ur || "",
          image: initial.image || "",
          active: initial.active,
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      update("image", data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nameEn: form.nameEn,
        nameUr: form.nameUr,
        slug: form.slug,
        descEn: form.descEn,
        descUr: form.descUr,
        image: form.image || undefined,
        active: form.active,
      };
      const res = await fetch(
        initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-mist-dark px-6 py-4">
          <h2 className="font-display text-sm font-bold text-ink">
            {initial ? "Edit Category" : "Add Category"}
          </h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-full p-1.5 hover:bg-mist"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name (English) <span className="text-red-400">*</span></label>
              <input
                required
                value={form.nameEn}
                onChange={(e) => update("nameEn", e.target.value)}
                placeholder="e.g. Perfumes"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Name (Urdu)</label>
              <input
                dir="rtl"
                value={form.nameUr}
                onChange={(e) => update("nameUr", e.target.value)}
                placeholder="پرفیومز"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="auto-generated from name if left blank"
                className={`${inputClass} font-mono text-xs`}
              />
              <p className="mt-1 text-[11px] text-storm/70">
                Used in the shop URL: /shop?category=your-slug
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description (English)</label>
              <textarea
                rows={2}
                value={form.descEn}
                onChange={(e) => update("descEn", e.target.value)}
                placeholder="Short description for the category"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description (Urdu)</label>
              <textarea
                rows={2}
                dir="rtl"
                value={form.descUr}
                onChange={(e) => update("descUr", e.target.value)}
                placeholder="تفصیل"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Category Image (optional)</label>
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-mist-dark/60 bg-mist">
                  {form.image ? (
                    <Image src={form.image} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-storm/40">
                      <Tag size={18} />
                    </div>
                  )}
                </div>
                <label className="focus-ring flex cursor-pointer items-center gap-2 rounded-xl border border-mist-dark px-4 py-2.5 text-xs font-semibold text-deep transition-colors hover:bg-mist">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  {uploading ? "Uploading…" : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => update("image", "")}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="cat-active"
                checked={form.active}
                onChange={(e) => update("active", e.target.checked)}
                className="h-4 w-4 rounded accent-deep"
              />
              <label htmlFor="cat-active" className="text-sm text-ink">
                Active (visible on storefront)
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-mist-dark pt-5">
            <button
              type="submit"
              disabled={saving}
              className="focus-ring flex items-center gap-2 rounded-xl bg-deep px-6 py-3 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all hover:bg-deep-light disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {initial ? "Save Changes" : "Create Category"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-mist-dark px-5 py-3 text-sm font-semibold text-storm transition-colors hover:bg-mist"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
