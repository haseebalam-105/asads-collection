import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getProductBySlugAsync, getRelatedProductsAsync } from "@/lib/catalog";
import ProductDetailClient from "@/components/ProductDetailClient";

// generateMetadata uses the static catalog for the known launch products so
// SEO tags are available immediately; new admin-added products still render
// correctly (with default site metadata) and pick up full tags after the
// next deploy/build.
export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProductBySlug(params.slug);
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.en,
    image: product.images,
    description: product.shortDescription.en,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
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
