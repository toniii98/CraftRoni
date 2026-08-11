import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/auth/register - Rejestracja konta klienta
// Konto nie jest wymagane do zakupów (goście kupują bez logowania).
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób rejestracji. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Konto z tym adresem email już istnieje" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        password: await hashPassword(parsed.data.password),
        role: "CUSTOMER",
      },
    });

    // Automatyczne zalogowanie po rejestracji
    await createSession(user.id, user.email, "CUSTOMER");

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}
