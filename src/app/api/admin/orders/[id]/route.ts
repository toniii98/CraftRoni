import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
    const body = await request.json();
    const { status, notes } = body;

    // Validate status if provided
    const validStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Nieprawidłowy status zamówienia" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // If status is PAID, set paidAt
      if (status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

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
  } catch (error: any) {
    console.error("Błąd aktualizacji zamówienia:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Zamówienie nie znalezione" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Błąd aktualizacji zamówienia" },
      { status: 500 }
    );
  }
}
