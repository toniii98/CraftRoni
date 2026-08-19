import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";
import { passwordResetConfirmSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";

// POST /api/auth/password-reset/confirm - Ustawienie nowego hasła z tokenu
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`password-reset-confirm:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = passwordResetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    const changed = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    if (!changed) {
      return NextResponse.json(
        { error: "Link wygasł lub został już wykorzystany. Poproś o nowy." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd ustawiania nowego hasła:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}
