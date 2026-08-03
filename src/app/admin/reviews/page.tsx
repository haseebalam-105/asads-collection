"use client";

import { useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import StarRating from "@/components/StarRating";

interface AdminReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  productId: string;
  productName: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setReviews(data.reviews);
      });
  };

  useEffect(load, []);

  const setApproved = async (r: AdminReview, approved: boolean) => {
    await fetch(`/api/admin/reviews/${r.productId}/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    load();
  };

  const deleteReview = async (r: AdminReview) => {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/admin/reviews/${r.productId}/${r.id}`, { method: "DELETE" });
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
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Reviews</h1>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl2 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{r.customerName}</p>
                <p className="text-xs text-storm">on {r.productName}</p>
                <div className="mt-1.5">
                  <StarRating rating={r.rating} />
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  r.approved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {r.approved ? "Approved" : "Pending"}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink/80">{r.comment}</p>
            <div className="mt-4 flex items-center gap-2">
              {!r.approved && (
                <button
                  onClick={() => setApproved(r, true)}
                  className="focus-ring flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                >
                  <Check size={13} /> Approve
                </button>
              )}
              {r.approved && (
                <button
                  onClick={() => setApproved(r, false)}
                  className="focus-ring flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  <X size={13} /> Unapprove
                </button>
              )}
              <button
                onClick={() => deleteReview(r)}
                className="focus-ring flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="py-10 text-center text-sm text-storm">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
