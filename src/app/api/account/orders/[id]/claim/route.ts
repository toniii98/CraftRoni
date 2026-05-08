import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: null,
        matchedUserId: session.userId,
        accountLinkStatus: "MATCHED_BY_EMAIL",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Nie można przejąć tego zamówienia" },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        userId: session.userId,
        accountLinkStatus: "LINKED",
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Błąd przypisywania zamówienia:", error);
    return NextResponse.json(
      { error: "Nie udało się przypisać zamówienia" },
      { status: 500 }
    );
  }
}
