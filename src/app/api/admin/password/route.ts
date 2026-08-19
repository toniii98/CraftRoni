import { NextResponse } from "next/server";
import { changePasswordAndRevokeOtherSessions, requireAdmin } from "@/lib/auth";
import { changePasswordSchema, firstZodMessage } from "@/lib/validation";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";

// PUT /api/admin/password - Zmiana hasła zalogowanego administratora
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const result = await changePasswordAndRevokeOtherSessions(
      session.userId,
      currentPassword,
      newPassword
    );

    if (result === "not-found") {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }
    if (result === "invalid-current") {
      return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe" }, { status: 400 });
    }
    if (result === "conflict") {
      return NextResponse.json(
        { error: "Hasło zostało równolegle zmienione. Zaloguj się ponownie." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd zmiany hasła:", error);
    return NextResponse.json({ error: "Błąd zmiany hasła" }, { status: 500 });
  }
}
