import { NextRequest, NextResponse } from "next/server";
import { EMAIL_VERIFICATION_COOKIE, verifyEmailWithToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import {
  emailVerificationConfirmSchema,
  emailVerificationSchema,
  firstZodMessage,
} from "@/lib/validation";

function clearVerificationCookie(response: NextResponse): NextResponse {
  response.cookies.set(EMAIL_VERIFICATION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/api/auth/verify-email",
  });
  return response;
}

// Token zużywamy wyłącznie po świadomym POST użytkownika. Skanery linków
// pocztowych mogą otworzyć GET startowy, ale nie aktywują konta.
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`verify-email:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const confirmation = emailVerificationConfirmSchema.safeParse(body);
    if (!confirmation.success) {
      return NextResponse.json(
        { error: firstZodMessage(confirmation.error) },
        { status: 400 }
      );
    }
    const parsedToken = emailVerificationSchema.safeParse({
      token: request.cookies.get(EMAIL_VERIFICATION_COOKIE)?.value,
    });
    if (!parsedToken.success) {
      return clearVerificationCookie(
        NextResponse.json(
          { error: "Link jest nieprawidłowy, wygasł albo został już użyty." },
          { status: 400 }
        )
      );
    }

    const verified = await verifyEmailWithToken(
      parsedToken.data.token,
      confirmation.data.password,
      confirmation.data.name,
      confirmation.data.termsAccepted
    );
    if (!verified) {
      return clearVerificationCookie(
        NextResponse.json(
          { error: "Link jest nieprawidłowy, wygasł albo został już użyty." },
          { status: 400 }
        )
      );
    }
    return clearVerificationCookie(NextResponse.json({ success: true }));
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd potwierdzenia adresu e-mail");
    return clearVerificationCookie(
      NextResponse.json({ error: "Nie udało się potwierdzić adresu e-mail." }, { status: 500 })
    );
  }
}
