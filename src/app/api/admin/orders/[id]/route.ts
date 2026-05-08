import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const validStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function GET(
  _request: NextRequest,
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
        user: { select: { id: true, email: true, name: true } },
        matchedUser: { select: { id: true, email: true, name: true } },
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie znalezione" }, { status: 404 });
    }

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
    const body = await request.json() as {
      status?: string;
      notes?: string;
      claimMatchedUser?: boolean;
    };

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        matchedUserId: true,
        userId: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Zamówienie nie znalezione" }, { status: 404 });
    }

    if (body.status && !validStatuses.includes(body.status as (typeof validStatuses)[number])) {
      return NextResponse.json(
        { error: "Nieprawidłowy status zamówienia" },
        { status: 400 }
      );
    }

    const updateData: {
      status?: (typeof validStatuses)[number];
      notes?: string | null;
      paidAt?: Date;
      userId?: string;
      accountLinkStatus?: "LINKED";
    } = {};

    if (body.status) {
      updateData.status = body.status as (typeof validStatuses)[number];
      if (body.status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    if (body.claimMatchedUser && !currentOrder.userId && currentOrder.matchedUserId) {
      updateData.userId = currentOrder.matchedUserId;
      updateData.accountLinkStatus = "LINKED";
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        matchedUser: { select: { id: true, email: true, name: true } },
        items: true,
      },
    });

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
    console.error("Błąd aktualizacji zamówienia:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji zamówienia" },
      { status: 500 }
    );
  }
}
