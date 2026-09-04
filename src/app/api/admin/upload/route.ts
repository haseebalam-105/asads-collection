import { NextRequest, NextResponse } from "next/server";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

/**
 * POST /api/admin/upload
 *
 * Multipart/form-data image upload to Cloudinary. Admin auth is enforced
 * by the middleware matcher in src/middleware.ts ("/api/admin/:path*"),
 * so this route handler only runs for authenticated admin sessions.
 *
 * Validation:
 *   - Only image MIME types allowed (jpeg, png, webp, gif)
 *   - Max file size 8 MB
 *   - Cloudinary must be configured
 *
 * Returns: { url: string } on success, { error: string } on failure.
 */
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  try {
    // Cloudinary config check — return a useful JSON error, never a 500.
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { success: false, error: "Cloudinary configuration is missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Send a 'file' field in multipart/form-data." },
        { status: 400 }
      );
    }

    // MIME type validation (server-side, never trust client-only validation).
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `Only image files are allowed (JPG, PNG, WEBP, GIF). Received: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }

    // File size validation.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is 8 MB. Received: ${(file.size / 1024 / 1024).toFixed(1)} MB` },
        { status: 400 }
      );
    }

    // Read file into buffer and upload to Cloudinary.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadImageBuffer(buffer);

    return NextResponse.json({ success: true, url: result.url, publicId: result.publicId });
  } catch (err: any) {
    console.error("[/api/admin/upload] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Could not upload image. Please try again." },
      { status: 500 }
    );
  }
}
