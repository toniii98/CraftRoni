import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const recipientName = typeof body.recipientName === "string" ? body.recipientName.trim() : "";
    const line1 = typeof body.line1 === "string" ? body.line1.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() : "";

    if (!recipientName || !line1 || !city || !postalCode) {
      return NextResponse.json(
        { error: "Uzupełnij wymagane pola adresu" },
        { status: 400 }
      );
    }

    const existingCount = await prisma.address.count({
      where: { userId: session.userId },
    });

    const shouldBeDefault = Boolean(body.isDefault) || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: session.userId,
          label: typeof body.label === "string" ? body.label.trim() || null : null,
          recipientName,
          phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
          line1,
          line2: typeof body.line2 === "string" ? body.line2.trim() || null : null,
          city,
          postalCode,
          countryCode: "PL",
          isDefault: shouldBeDefault,
        },
      });
    });

    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    console.error("Błąd dodawania adresu:", error);
    return NextResponse.json(
      { error: "Nie udało się dodać adresu" },
      { status: 500 }
    );
  }
}
