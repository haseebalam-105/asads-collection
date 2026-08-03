"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BlogPost } from "@/types/product";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPosts(data.posts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    load();
  };

  if (error) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        <p className="font-semibold">Database not connected yet</p>
        <p className="mt-1 text-storm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-ink">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="focus-ring flex items-center gap-1.5 rounded-full bg-deep px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New Post
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-storm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-mist-dark last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{p.title.en}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-storm">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/${p.id}`}
                        className="focus-ring rounded-full p-1.5 text-storm hover:bg-mist hover:text-deep"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.title.en)}
                        className="focus-ring rounded-full p-1.5 text-storm hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-storm">
                    No blog posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
