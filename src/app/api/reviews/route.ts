import { NextRequest, NextResponse } from "next/server";
import { dbGetProductBySlug } from "@/lib/db/products";
import {
  dbUpsertProductReview,
  dbCheckVerifiedPurchase,
} from "@/lib/db/products";
import { isDbConfigured } from "@/lib/db";
import { Review } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/reviews?productId=... or ?slug=...
 *
 * Returns only APPROVED reviews for the product (public endpoint, no auth).
 * Also returns the aggregate rating summary.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const slug = searchParams.get("slug");

  if (!productId && !slug) {
    return NextResponse.json(
      { error: "productId or slug is required." },
      { status: 400 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ reviews: [], rating: 0, reviewCount: 0 });
  }

  try {
    let product = null;
    if (slug) {
      product = await dbGetProductBySlug(slug);
    } else if (productId) {
      const { dbGetProductById } = await import("@/lib/db/products");
      product = await dbGetProductById(productId);
    }
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const approvedReviews = (product.reviews || []).filter((r) => r.approved);
    const reviewCount = approvedReviews.length;
    const rating = reviewCount > 0
      ? approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
      : 0;

    return NextResponse.json({
      reviews: approvedReviews,
      rating: Math.round(rating * 10) / 10,
      reviewCount,
    });
  } catch (err: any) {
    console.error("[/api/reviews GET]", err);
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Public submission — no admin auth required (the middleware matcher in
 * src/middleware.ts only protects /api/admin/*, not /api/reviews).
 *
 * Body: { productId, slug, customerName, customerEmail?, customerPhone?,
 *         rating, title?, comment }
 *
 * The review is saved with approved=false (moderation). verifiedPurchase
 * is set to true ONLY if we can confirm a matching order exists.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Reviews are not available in demo mode." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      productId,
      slug,
      customerName,
      customerEmail,
      customerPhone,
      rating,
      title,
      comment,
    } = body as {
      productId?: string;
      slug?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      rating?: number;
      title?: string;
      comment?: string;
    };

    // --- Validation ---
    if (!productId && !slug) {
      return NextResponse.json(
        { error: "Product ID or slug is required." },
        { status: 400 }
      );
    }
    const name = (customerName || "").trim();
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your name (at least 2 characters)." },
        { status: 400 }
      );
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }
    const reviewText = (comment || "").trim();
    if (!reviewText || reviewText.length < 10) {
      return NextResponse.json(
        { error: "Please write a review of at least 10 characters." },
        { status: 400 }
      );
    }
    if (reviewText.length > 2000) {
      return NextResponse.json(
        { error: "Review is too long (maximum 2000 characters)." },
        { status: 400 }
      );
    }
    const titleTrimmed = (title || "").trim().slice(0, 120);

    // --- Look up product ---
    let product = null;
    if (slug) {
      product = await dbGetProductBySlug(slug);
    } else if (productId) {
      const { dbGetProductById } = await import("@/lib/db/products");
      product = await dbGetProductById(productId);
    }
    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // --- Duplicate review prevention ---
    // If the customer provided an email, check if they've already reviewed
    // this product (by email). We allow multiple reviews from the same
    // person only if they use a different email — this is a soft check,
    // not a hard security boundary.
    if (customerEmail) {
      const existing = (product.reviews || []).find(
        (r) => r.customerEmail === customerEmail.trim().toLowerCase()
      );
      if (existing) {
        return NextResponse.json(
          { error: "You've already reviewed this product. Thank you!" },
          { status: 409 }
        );
      }
    }

    // --- Verified purchase check ---
    // Only set verifiedPurchase=true if we can actually find a matching
    // order in the database. Never set it blindly.
    const verifiedPurchase = await dbCheckVerifiedPurchase(
      product.id,
      customerPhone,
      customerEmail
    );

    // --- Save the review (moderated: approved=false) ---
    const review: Review = {
      id: crypto.randomUUID(),
      customerName: name,
      rating: ratingNum,
      comment: reviewText,
      approved: false, // moderation — admin must approve before it appears
      createdAt: new Date().toISOString(),
      title: titleTrimmed || undefined,
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : undefined,
      verifiedPurchase,
    };

    await dbUpsertProductReview(product.id, review);

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you! Your review has been submitted and is awaiting approval.",
        review,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[/api/reviews POST]", err);
    return NextResponse.json(
      { error: "Could not submit your review. Please try again." },
      { status: 500 }
    );
  }
}
