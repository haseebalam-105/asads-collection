import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "asad_admin_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local — see .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSessionPayload {
  email: string;
  role: "admin";
}

export async function signSession(payload: AdminSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySession(
  token: string | undefined
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin" || typeof payload.email !== "string") return null;
    return { email: payload.email, role: "admin" };
  } catch {
    return null;
  }
}
