import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateOrderNumber, normalizeEmail } from "@/lib/utils";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      items,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingZip,
      notes,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Koszyk jest pusty" },
        { status: 400 }
      );
    }

    if (!customerEmail || !customerName || !shippingAddress || !shippingCity || !shippingZip) {
      return NextResponse.json(
        { success: false, error: "Brakuje wymaganych danych" },
        { status: 400 }
      );
    }

    const productIds = items.map((item: OrderItemInput) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "Niektóre produkty nie istnieją" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const orderItems = items.map((item: OrderItemInput) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product || item.quantity <= 0) {
        throw new Error("Nieprawidłowa pozycja koszyka");
      }

      const price = product.salePrice || product.price;
      subtotal += Number(price) * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: Number(price),
        name: product.name,
      };
    });

    const normalizedCustomerEmail = normalizeEmail(customerEmail);
    const shippingCost = subtotal >= 200 ? 0 : 15;
    const total = subtotal + shippingCost;

    const matchedUser = session
      ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } })
      : await prisma.user.findUnique({ where: { emailNormalized: normalizedCustomerEmail }, select: { id: true } });

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.userId || null,
        matchedUserId: matchedUser?.id || null,
        checkoutType: session ? "ACCOUNT" : "GUEST",
        accountLinkStatus: session ? "LINKED" : matchedUser ? "MATCHED_BY_EMAIL" : "NONE",
        normalizedCustomerEmail,
        customerEmail,
        customerName,
        customerPhone: customerPhone || null,
        shippingAddress,
        shippingCity,
        shippingZip,
        notes: notes || null,
        subtotal,
        shippingCost,
        total,
        status: "PENDING",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    const url = new URL("/zamowienie/potwierdzenie", request.url);
    url.searchParams.set("order", order.orderNumber);
    url.searchParams.set("token", order.accessToken);
    if (!session) {
      url.searchParams.set("email", customerEmail);
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        paymentUrl: `${url.pathname}${url.search}`,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się utworzyć zamówienia" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const token = searchParams.get("token");

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Brak numeru zamówienia" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Zamówienie nie zostało znalezione" },
        { status: 404 }
      );
    }

    const isAdmin = session?.role === "ADMIN";
    const hasTokenAccess = token === order.accessToken;
    const hasUserAccess = Boolean(
      session && (order.userId === session.userId || order.matchedUserId === session.userId)
    );

    if (!isAdmin && !hasTokenAccess && !hasUserAccess) {
      return NextResponse.json(
        { success: false, error: "Brak dostępu do tego zamówienia" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się pobrać zamówienia" },
      { status: 500 }
    );
  }
}
