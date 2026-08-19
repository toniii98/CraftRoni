import { NextRequest, NextResponse } from "next/server";
import { EMAIL_VERIFICATION_COOKIE } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { emailVerificationSchema } from "@/lib/validation";
import { isProductionEnvironment } from "@/lib/runtime-env";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/konto/potwierdz-email", request.url));
  response.headers.set("Cache-Control", "no-store");

  const limit = rateLimit(`verify-email-start:${clientIp(request)}`, 20, 60 * 60 * 1000);
  const parsed = emailVerificationSchema.safeParse({
    token: request.nextUrl.searchParams.get("token"),
  });
  if (!limit.ok || !parsed.success) return response;

  response.cookies.set(EMAIL_VERIFICATION_COOKIE, parsed.data.token, {
    httpOnly: true,
    secure: isProductionEnvironment(),
    sameSite: "lax",
    maxAge: 30 * 60,
    path: "/api/auth/verify-email",
  });
  return response;
}
