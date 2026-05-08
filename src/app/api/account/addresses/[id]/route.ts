import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;
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

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Adres nie został znaleziony" }, { status: 404 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (Boolean(body.isDefault)) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          label: typeof body.label === "string" ? body.label.trim() || null : null,
          recipientName,
          phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
          line1,
          line2: typeof body.line2 === "string" ? body.line2.trim() || null : null,
          city,
          postalCode,
          countryCode: "PL",
          isDefault: Boolean(body.isDefault),
        },
      });
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error("Błąd aktualizacji adresu:", error);
    return NextResponse.json(
      { error: "Nie udało się zapisać adresu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Adres nie został znaleziony" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      if (existing.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId: session.userId },
          orderBy: { createdAt: "asc" },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania adresu:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć adresu" },
      { status: 500 }
    );
  }
}
