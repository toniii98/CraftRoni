import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || new TextEncoder().encode(authSecret).byteLength < 32) {
  // Celowo bez fallbacku: znany publicznie sekret pozwoliłby podrobić token admina.
  throw new Error(
    "AUTH_SECRET musi zawierać co najmniej 32 bajty losowych danych"
  );
}

const JWT_SECRET = new TextEncoder().encode(authSecret);

const COOKIE_NAME = "craftroni-session";

// Ścieżki wymagające autoryzacji admina
const ADMIN_PATHS = ["/admin"];
// Ścieżki publiczne w panelu admina (nie wymagają logowania)
const PUBLIC_ADMIN_PATHS = ["/admin/login"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin/");

  // API panelu wykonuje właściwą autoryzację w trasach. Tutaj dokładamy ochronę
  // origin/CSRF dla żądań przeglądarkowych korzystających z cookie sesyjnego.
  if (isAdminApi) {
    if (
      UNSAFE_METHODS.has(request.method) &&
      (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production")
    ) {
      let expectedOrigin: string;
      try {
        expectedOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || "").origin;
      } catch {
        return NextResponse.json({ error: "Nieprawidłowa konfiguracja originu" }, { status: 503 });
      }
      if (request.headers.get("origin") !== expectedOrigin) {
        return NextResponse.json({ error: "Nieprawidłowe źródło żądania" }, { status: 403 });
      }
      const fetchSite = request.headers.get("sec-fetch-site");
      if (fetchSite && fetchSite !== "same-origin") {
        return NextResponse.json({ error: "Żądanie cross-site zostało odrzucone" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

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
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });

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
    "/api/admin/:path*",
  ],
};
