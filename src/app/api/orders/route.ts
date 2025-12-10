import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

// POST /api/orders - Tworzenie nowego zamówienia
export async function POST(request: NextRequest) {
  try {
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
    
    // Walidacja
    if (!items || items.length === 0) {
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
    
    // Pobierz produkty z bazy żeby zweryfikować ceny
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    
    // Sprawdź czy wszystkie produkty istnieją
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "Niektóre produkty nie istnieją" },
        { status: 400 }
      );
    }
    
    // Oblicz sumę
    let subtotal = 0;
    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Produkt nie znaleziony");
      
      const price = product.salePrice || product.price;
      subtotal += Number(price) * item.quantity;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: Number(price),
        name: product.name,
      };
    });
    
    const shippingCost = subtotal >= 200 ? 0 : 15;
    const total = subtotal + shippingCost;
    
    // Utwórz zamówienie
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
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
    
    // TODO: Tutaj zintegrować z Przelewy24
    // Na razie zwracamy zamówienie z linkiem do płatności testowej
    
    return NextResponse.json({
      success: true,
      data: {
        order,
        paymentUrl: `/zamowienie/potwierdzenie?order=${order.orderNumber}`, // Tymczasowo
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

// GET /api/orders/[orderNumber] - Szczegóły zamówienia
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    
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
