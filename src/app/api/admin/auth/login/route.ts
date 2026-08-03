import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password.trim()
        : "";

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    const adminPasswordHash =
      process.env.ADMIN_PASSWORD_HASH?.trim();

    if (!adminEmail || !adminPasswordHash) {
      return NextResponse.json(
        {
          error:
            "Admin credentials are not configured. Check ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env.local.",
        },
        { status: 500 }
      );
    }

    if (!email || !password || email !== adminEmail) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(
      password,
      adminPasswordHash
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signSession({
      email: adminEmail,
      role: "admin",
    });

    const res = NextResponse.json({ ok: true });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Unable to process login request." },
      { status: 500 }
    );
  }
}