import { createHash, randomBytes } from "node:crypto";
import { after, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createEmailVerificationToken, hashPassword } from "@/lib/auth";
import { isEmailConfigured, sendEmailVerificationEmail } from "@/lib/email";
import { registerSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import { publicAppOrigin } from "@/lib/runtime-env";

// Konto klienta wymaga potwierdzenia własności adresu e-mail. Odpowiedź nie
// zdradza, czy adres był już zarejestrowany; istniejącego hasła nie nadpisujemy.
export async function POST(request: Request) {
  const genericResponse = NextResponse.json(
    {
      success: true,
      message:
        "Jeśli ten adres może zostać użyty, wysłaliśmy link aktywacyjny. Sprawdź pocztę.",
    },
    { status: 202 }
  );

  try {
    const limit = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób rejestracji. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Rejestracja jest chwilowo niedostępna. Spróbuj ponownie później." },
        { status: 503 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const emailKey = createHash("sha256").update(email, "utf8").digest("hex");
    const emailLimit = rateLimit(`register-email:${emailKey}`, 3, 60 * 60 * 1000);
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób rejestracji. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }

    // Hash wykonujemy również dla istniejącego adresu, aby ograniczyć różnicę
    // czasu odpowiedzi pozwalającą na enumerację kont.
    const password = await hashPassword(randomBytes(32).toString("base64url"));
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: null,
        password,
        role: "CUSTOMER",
      },
      update: {},
      select: {
        id: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
      },
    });

    if (user.role === "CUSTOMER" && !user.emailVerifiedAt) {
      const token = await createEmailVerificationToken(user.id);
      const verificationUrl = `${publicAppOrigin()}/api/auth/email-verification-start?${new URLSearchParams(
        { token }
      ).toString()}`;
      after(async () => {
        try {
          await sendEmailVerificationEmail({
            to: user.email,
            name: null,
            verificationUrl,
          });
        } catch {
          console.error("[register] Nie udało się przygotować wiadomości aktywacyjnej");
        }
      });
    }

    return genericResponse;
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd rejestracji");
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}
