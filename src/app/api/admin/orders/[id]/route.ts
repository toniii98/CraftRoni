import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { orderUpdateSchema, firstZodMessage } from "@/lib/validation";
import {
  sendPaymentConfirmedEmail,
  sendOrderShippedEmail,
  toOrderEmailData,
} from "@/lib/email";

// GET /api/admin/orders/[id] - Pobierz szczegóły zamówienia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1 },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Zamówienie nie znalezione" },
        { status: 404 }
      );
    }

    // Convert Decimal to number
    const formattedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Błąd pobierania zamówienia:", error);
    return NextResponse.json(
      { error: "Błąd pobierania zamówienia" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Aktualizuj zamówienie (status, notatki)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const { status, notes } = parsed.data;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Zamówienie nie znalezione" },
        { status: 404 }
      );
    }

    const updateData: { status?: typeof existing.status; paidAt?: Date; notes?: string } = {};

    if (status) {
      updateData.status = status;
      if (status === "PAID" && !existing.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    // Notatki dopisujemy z datą, zamiast nadpisywać —
    // wcześniejsze wpisy (np. numer przesyłki) nie mogą ginąć.
    if (notes) {
      const stamp = new Date().toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const entry = `[${stamp}] ${notes}`;
      updateData.notes = existing.notes ? `${existing.notes}\n${entry}` : entry;
    }

    const order = await prisma.$transaction(async (tx) => {
      // Anulowanie zwraca produkty na magazyn; cofnięcie anulowania
      // ponownie zdejmuje stan (o ile produkty są jeszcze dostępne).
      if (status === "CANCELLED" && existing.status !== "CANCELLED") {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      } else if (status && status !== "CANCELLED" && existing.status === "CANCELLED") {
        for (const item of existing.items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(
              `STOCK:Brak stanu magazynowego dla "${item.name}" — nie można przywrócić zamówienia`
            );
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });
    });

    // Powiadomienia e-mail przy zmianie statusu (błędy wysyłki nie przerywają zapisu)
    if (status && status !== existing.status) {
      const emailData = toOrderEmailData(order);
      if (status === "PAID") {
        await sendPaymentConfirmedEmail(emailData);
      } else if (status === "SHIPPED") {
        await sendOrderShippedEmail(emailData);
      }
    }

    // Convert Decimal to number
    const formattedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STOCK:")) {
      return NextResponse.json(
        { error: error.message.slice("STOCK:".length) },
        { status: 400 }
      );
    }

    console.error("Błąd aktualizacji zamówienia:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji zamówienia" },
      { status: 500 }
    );
  }
}
