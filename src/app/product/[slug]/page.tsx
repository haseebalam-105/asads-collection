import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugAsync, getRelatedProductsAsync } from "@/lib/catalog";
import ProductDetailClient from "@/components/ProductDetailClient";
import {
  activeVariants,
  getDisplayPrice,
  getMaxVariantPrice,
  hasVariants,
  isProductInStock,
} from "@/lib/variants";

/**
 * generateMetadata — uses the SAME async/DB-aware product source as the
 * page itself (getProductBySlugAsync). This means:
 *  - When MongoDB is configured, admin-created products get correct SEO
 *    tags immediately (title, description, OG image, canonical URL).
 *  - When MongoDB is not configured or unreachable, falls back to the
 *    static catalog in lib/products.ts so the launch products still get
 *    their SEO tags without a redeploy.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlugAsync(params.slug);
  if (!product) return {};

  return {
    title: product.name.en,
    description: product.shortDescription.en,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name.en,
      description: product.shortDescription.en,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugAsync(params.slug);
  if (!product) notFound();

  const related = await getRelatedProductsAsync(params.slug);

  const variantMode = hasVariants(product);
  const variants = activeVariants(product);
  const displayPrice = getDisplayPrice(product);
  const overallInStock = isProductInStock(product);

  // Only include approved reviews in structured data — never fake counts.
  const approvedReviews = (product.reviews || []).filter((r) => r.approved);
  const reviewCount = approvedReviews.length;
  const rating = reviewCount > 0
    ? approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
    : 0;

  // Schema.org structured data. For variant products we emit an
  // AggregateOffer with lowPrice/highPrice; for simple products a single Offer.
  // If there are approved reviews, we add aggregateRating + Review entries
  // so Google can show rich snippets.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.en,
    image: product.images,
    description: product.shortDescription.en,
    sku: product.sku,
    offers: variantMode && variants.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "PKR",
          lowPrice: displayPrice,
          highPrice: getMaxVariantPrice(product) ?? displayPrice,
          offerCount: variants.length,
          availability: overallInStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }
      : {
          "@type": "Offer",
          priceCurrency: "PKR",
          price: product.price,
          availability: product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
    // Only include aggregateRating when there are real approved reviews —
    // never output fake review counts or ratings.
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(rating * 10) / 10,
            reviewCount,
          },
          review: approvedReviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.customerName },
            datePublished: r.createdAt,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.comment,
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
