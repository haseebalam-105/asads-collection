"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, Save } from "lucide-react";
import { BlogPost } from "@/types/product";

type FormState = {
  titleEn: string;
  titleUr: string;
  slug: string;
  excerptEn: string;
  contentEn: string;
  coverImage: string;
  published: boolean;
};

function toFormState(p?: BlogPost): FormState {
  return {
    titleEn: p?.title.en || "",
    titleUr: p?.title.ur || "",
    slug: p?.slug || "",
    excerptEn: p?.excerpt.en || "",
    contentEn: p?.content.en || "",
    coverImage: p?.coverImage || "",
    published: p?.published ?? false,
  };
}

export default function BlogForm({ post, postId }: { post?: BlogPost; postId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(post));
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
      update("coverImage", data.url);
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

    const payload: Partial<BlogPost> = {
      title: { en: form.titleEn, ur: form.titleUr || form.titleEn },
      slug: form.slug || form.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt: { en: form.excerptEn, ur: form.excerptEn },
      content: { en: form.contentEn, ur: form.contentEn },
      coverImage: form.coverImage,
      published: form.published,
    };

    try {
      const res = await fetch(postId ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/blog");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Title (English) *</label>
            <input
              required
              value={form.titleEn}
              onChange={(e) => update("titleEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Title (Urdu)</label>
            <input
              dir="rtl"
              value={form.titleUr}
              onChange={(e) => update("titleUr", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-storm">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto-generated from title if left blank"
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-storm">Excerpt</label>
            <input
              value={form.excerptEn}
              onChange={(e) => update("excerptEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-storm">Content</label>
            <textarea
              rows={10}
              value={form.contentEn}
              onChange={(e) => update("contentEn", e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-sm font-bold text-ink">Cover Image</h2>
        <div className="flex items-center gap-3">
          {form.coverImage && (
            <div className="group relative h-20 w-32 overflow-hidden rounded-lg bg-mist">
              <Image src={form.coverImage} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => update("coverImage", "")}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <label className="flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-mist-dark text-storm hover:border-deep hover:text-deep">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-[10px] font-semibold">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={(e) => update("published", e.target.checked)}
          className="h-4 w-4 accent-deep"
        />
        <label htmlFor="published" className="text-sm text-ink">
          Published (visible on the public blog)
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="focus-ring flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {postId ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}
