import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";
import { passwordResetRequestSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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

    const body = await request.json().catch(() => null);
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      console.warn("[password-reset] SMTP nieskonfigurowane — link nie zostanie wysłany");
      return genericResponse;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Reset dotyczy kont klientów; hasło administratora zmienia się w panelu
    if (user && user.role === "CUSTOMER") {
      const token = await createPasswordResetToken(user.id);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: `${appUrl}/konto/reset-hasla/${token}`,
      });
    }

    return genericResponse;
  } catch (error) {
    console.error("Błąd żądania resetu hasła:", error);
    // Także tutaj nie zdradzamy szczegółów
    return genericResponse;
  }
}
