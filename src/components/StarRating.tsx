"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Star } from "lucide-react";

/**
 * Display-only star rating. Renders 5 stars with the appropriate fill
 * based on the `rating` prop (supports half-stars visually by rounding).
 */
export function StarRatingDisplay({
  rating,
  size = 14,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= rounded
              ? "fill-gold text-gold"
              : "fill-mist-dark text-mist-dark"
          }
        />
      ))}
    </div>
  );
}

/**
 * Interactive star rating INPUT — keyboard accessible.
 *
 * - Arrow Left / Right decrements / increments the rating.
 * - Number keys 1–5 set the rating directly.
 * - Enter / Space confirms.
 * - Hover preview (mouse only).
 *
 * The component is a radiogroup with proper ARIA roles so screen readers
 * announce the current selection.
 */
export function StarRatingInput({
  value = 0,
  onChange,
  size = 28,
}: {
  value?: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        onChange(Math.min(5, value + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        onChange(Math.max(1, value - 1));
      } else if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        onChange(Number(e.key));
      }
    },
    [value, onChange]
  );

  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      tabIndex={0}
      onKeyDown={handleKey}
      className="focus-ring inline-flex items-center gap-1 rounded-lg outline-none"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={size}
            className={
              n <= display
                ? "fill-gold text-gold"
                : "fill-mist text-mist-dark"
            }
          />
        </button>
      ))}
    </div>
  );
}

// Default export for backward compatibility — existing imports use
// `<StarRating rating={...} />` as a display component.
export default function StarRating({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return <StarRatingDisplay rating={rating} size={size} />;
}
