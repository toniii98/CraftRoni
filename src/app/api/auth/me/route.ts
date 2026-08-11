import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        name: user?.name ?? null,
      },
    });
  } catch (error) {
    console.error("Błąd sprawdzania sesji:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
