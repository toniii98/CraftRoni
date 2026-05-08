import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!fullName) {
      return NextResponse.json(
        { error: "Imię i nazwisko jest wymagane" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: fullName,
        profile: {
          upsert: {
            create: {
              fullName,
              phone: phone || null,
            },
            update: {
              fullName,
              phone: phone || null,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Błąd aktualizacji profilu:", error);
    return NextResponse.json(
      { error: "Nie udało się zapisać danych konta" },
      { status: 500 }
    );
  }
}
