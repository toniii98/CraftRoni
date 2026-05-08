import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "craftroni-secret-key-change-in-production"
);

const COOKIE_NAME = "craftroni-session";
const ADMIN_PATHS = ["/admin"];
const PUBLIC_ADMIN_PATHS = ["/admin/login"];
const ACCOUNT_PATHS = ["/konto"];
const PUBLIC_ACCOUNT_PATHS = ["/konto/logowanie", "/konto/rejestracja"];

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const expiresAt = new Date(payload.expiresAt as string);

    if (new Date() > expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname === path);
  const isAccountPath = ACCOUNT_PATHS.some((path) => pathname.startsWith(path));
  const isPublicAccountPath = PUBLIC_ACCOUNT_PATHS.some((path) => pathname === path);

  if (isAdminPath && !isPublicAdminPath) {
    const payload = await readSession(request);

    if (!payload || payload.role !== "ADMIN") {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  if (isAccountPath && !isPublicAccountPath) {
    const payload = await readSession(request);

    if (!payload) {
      const redirectUrl = new URL("/konto/logowanie", request.url);
      redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/konto/:path*"],
};
