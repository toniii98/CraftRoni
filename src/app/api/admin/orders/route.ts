import { AccountLinkStatus, CheckoutType, OrderStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const checkoutType = searchParams.get("checkoutType");
    const accountLinkStatus = searchParams.get("accountLinkStatus");
    const offset = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status && status !== "all") {
      where.status = status as OrderStatus;
    }

    if (checkoutType && checkoutType !== "all") {
      where.checkoutType = checkoutType as CheckoutType;
    }

    if (accountLinkStatus && accountLinkStatus !== "all") {
      where.accountLinkStatus = accountLinkStatus as AccountLinkStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          matchedUser: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const formattedOrders = orders.map((order) => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Błąd pobierania zamówień:", error);
    return NextResponse.json(
      { error: "Błąd pobierania zamówień" },
      { status: 500 }
    );
  }
}
