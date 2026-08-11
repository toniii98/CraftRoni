import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.AUTH_SECRET) {
  // Celowo bez fallbacku: znany publicznie sekret pozwoliłby podrobić token admina.
  throw new Error(
    "Brak zmiennej środowiskowej AUTH_SECRET. Wygeneruj ją poleceniem: openssl rand -base64 32"
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

const COOKIE_NAME = "craftroni-session";

// Ścieżki wymagające autoryzacji admina
const ADMIN_PATHS = ["/admin"];
// Ścieżki publiczne w panelu admina (nie wymagają logowania)
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sprawdź czy to ścieżka admina
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname === path);

  // Jeśli to publiczna ścieżka admina lub nie jest to panel admina - przepuść
  if (!isAdminPath || isPublicAdminPath) {
    return NextResponse.next();
  }

  // Pobierz token z cookies
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // Brak tokenu - przekieruj do logowania
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    // Zweryfikuj token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Sprawdź czy użytkownik jest adminem
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Sprawdź czy token nie wygasł
    const expiresAt = new Date(payload.expiresAt as string);
    if (new Date() > expiresAt) {
      // Token wygasł - przekieruj do logowania
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Token ważny - przepuść
    return NextResponse.next();
  } catch {
    // Token nieprawidłowy - przekieruj do logowania
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    // Dopasuj wszystkie ścieżki admina
    "/admin/:path*",
  ],
};
