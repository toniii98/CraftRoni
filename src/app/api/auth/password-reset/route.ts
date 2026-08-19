import { after, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";
import { passwordResetRequestSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import { publicAppOrigin } from "@/lib/runtime-env";

// POST /api/auth/password-reset - Prośba o link do zresetowania hasła
//
// Odpowiedź jest zawsze taka sama, niezależnie od tego, czy konto istnieje —
// inaczej endpoint pozwalałby sprawdzać, kto ma konto w sklepie.
export async function POST(request: Request) {
  const genericResponse = NextResponse.json({
    success: true,
    message:
      "Jeśli konto o podanym adresie istnieje, wysłaliśmy na nie link do zresetowania hasła.",
  });

  try {
    const limit = rateLimit(`password-reset:${clientIp(request)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      console.warn("[password-reset] SMTP nieskonfigurowane — link nie zostanie wysłany");
      return genericResponse;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const appUrl = publicAppOrigin();

    // Lookup i SMTP odbywają się po wysłaniu identycznej odpowiedzi. Czas
    // odpowiedzi nie zdradza, czy konto o podanym adresie istnieje.
    after(async () => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Reset dotyczy kont klientów; hasło administratora zmienia się w panelu.
        if (!user || user.role !== "CUSTOMER") return;
        const token = await createPasswordResetToken(user.id);
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl: `${appUrl}/konto/reset-hasla/${token}`,
        });
      } catch {
        console.error("[password-reset] Nie udało się przygotować wiadomości");
      }
    });

    return genericResponse;
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd żądania resetu hasła:", error);
    // Także tutaj nie zdradzamy szczegółów
    return genericResponse;
  }
}
