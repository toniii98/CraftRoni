import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdmin,
  verifyPassword,
  hashPassword,
  revokeOtherSessions,
} from "@/lib/auth";
import { changePasswordSchema, firstZodMessage } from "@/lib/validation";

// PUT /api/admin/password - Zmiana hasła zalogowanego administratora
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    // Wyloguj pozostałe urządzenia — bieżąca sesja zostaje
    await revokeOtherSessions(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd zmiany hasła:", error);
    return NextResponse.json({ error: "Błąd zmiany hasła" }, { status: 500 });
  }
}
