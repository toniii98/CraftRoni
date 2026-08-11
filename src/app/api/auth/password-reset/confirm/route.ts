import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  consumePasswordResetToken,
  hashPassword,
  revokeAllSessions,
} from "@/lib/auth";
import { passwordResetConfirmSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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

    const body = await request.json().catch(() => null);
    const parsed = passwordResetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    const userId = await consumePasswordResetToken(parsed.data.token);
    if (!userId) {
      return NextResponse.json(
        { error: "Link wygasł lub został już wykorzystany. Poproś o nowy." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(parsed.data.password) },
    });

    // Reset hasła wylogowuje wszystkie urządzenia
    await revokeAllSessions(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd ustawiania nowego hasła:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}
