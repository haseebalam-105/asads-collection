import { NextRequest, NextResponse } from "next/server";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local.",
      },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadImageBuffer(buffer);

  return NextResponse.json({ url });
}
