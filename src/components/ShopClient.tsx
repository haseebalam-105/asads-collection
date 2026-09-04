"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { Category, Product } from "@/types/product";
import { getDisplayPrice, hasVariants } from "@/lib/variants";

type SortKey = "newest" | "price-low" | "price-high" | "popular";

export default function ShopClient({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  return (
    <Suspense fallback={null}>
      <ShopPageContent initialProducts={initialProducts} categories={categories} />
    </Suspense>
  );
}

function ShopPageContent({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>("newest");

  // Dynamic max price — derived from the highest variant or product price,
  // rounded up to the next 500 so the slider has sensible steps.
  const computedMaxPrice = useMemo(() => {
    const allPrices = initialProducts.flatMap((p) =>
      hasVariants(p) && p.variants && p.variants.length > 0
        ? p.variants.filter((v) => v.active).map((v) => v.price)
        : [p.price]
    );
    if (allPrices.length === 0) return 5000;
    const max = Math.max(...allPrices);
    // Round up to the next 500
    return Math.max(5000, Math.ceil(max / 500) * 500);
  }, [initialProducts]);

  const [maxPrice, setMaxPrice] = useState(computedMaxPrice);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const products = initialProducts;

  const filtered = useMemo(() => {
    let list = products.filter((p) => getDisplayPrice(p) <= maxPrice);

    if (category !== "all") {
      // Match by category slug (legacy) OR categoryId (new).
      // For legacy products, p.category is a slug; for new ones, the
      // category object's slug is matched against either p.category or
      // via the categories list lookup.
      list = list.filter((p) => {
        if (p.category === category) return true;
        const cat = categories.find((c) => c.slug === category);
        return cat && p.categoryId === cat.id;
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.en.toLowerCase().includes(q) ||
          p.name.ur.includes(q) ||
          p.shortDescription.en.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "price-low":
        list = [...list].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
        break;
      case "price-high":
        list = [...list].sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
        break;
      case "popular":
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        list = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return list;
  }, [products, category, query, sort, maxPrice, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {t.shop.title}
          </h1>
          <p className="mt-1 text-sm text-storm">
            {filtered.length} {locale === "ur" ? "پروڈکٹس" : "products"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.nav.search}
            className="focus-ring w-48 rounded-full border border-mist-dark px-4 py-2 text-sm sm:w-60"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="focus-ring rounded-full border border-mist-dark px-3 py-2 text-sm"
          >
            <option value="newest">{t.shop.sortNewest}</option>
            <option value="price-low">{t.shop.sortPriceLow}</option>
            <option value="price-high">{t.shop.sortPriceHigh}</option>
            <option value="popular">{t.shop.sortPopular}</option>
          </select>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="focus-ring flex items-center gap-1.5 rounded-full border border-mist-dark px-3 py-2 text-sm lg:hidden"
          >
            <SlidersHorizontal size={14} /> {t.shop.filters}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
          <div className="space-y-8 rounded-xl2 border border-mist-dark p-5">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-storm">
                {t.shop.category}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setCategory("all")}
                  className={`focus-ring block w-full rounded-lg px-3 py-2 text-left rtl:text-right text-sm ${
                    category === "all" ? "bg-deep text-white" : "hover:bg-mist"
                  }`}
                >
                  {t.shop.all}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.slug)}
                    className={`focus-ring block w-full rounded-lg px-3 py-2 text-left rtl:text-right text-sm ${
                      category === c.slug ? "bg-deep text-white" : "hover:bg-mist"
                    }`}
                  >
                    {c.name[locale]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-storm">
                {t.shop.price}
              </h3>
              <input
                type="range"
                min={500}
                max={computedMaxPrice}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-deep"
              />
              <p className="mt-1 font-mono text-xs text-storm">
                Rs. 0 — Rs. {maxPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-storm">{t.shop.noResults}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
