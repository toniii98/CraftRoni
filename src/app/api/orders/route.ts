import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { createOrderSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getShopSettings } from "@/lib/settings";
import { isP24Configured, registerTransaction } from "@/lib/p24";
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotification,
  toOrderEmailData,
} from "@/lib/email";

class OrderError extends Error {}

// POST /api/orders - Tworzenie nowego zamówienia
export async function POST(request: NextRequest) {
  try {
    // Ochrona przed spamem zamówień: 10 zamówień na godzinę z jednego IP
    const limit = rateLimit(`orders:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Zbyt wiele zamówień. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Scal zduplikowane pozycje (ten sam produkt dodany wielokrotnie)
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }
    const productIds = [...quantities.keys()];

    const settings = await getShopSettings();

    // Zalogowany klient — zamówienie trafi do historii jego konta.
    // Goście zamawiają bez konta (userId = null).
    const session = await getSession();

    // Cała operacja w transakcji: weryfikacja produktów, zdjęcie stanu
    // magazynowego i utworzenie zamówienia — wszystko albo nic.
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });

      if (products.length !== productIds.length) {
        throw new OrderError("Niektóre produkty nie są już dostępne");
      }

      let subtotal = 0;
      const orderItems = products.map((product) => {
        const quantity = quantities.get(product.id)!;
        const price = Number(product.price);
        const salePrice = product.salePrice ? Number(product.salePrice) : null;
        const unitPrice = salePrice && salePrice < price ? salePrice : price;
        subtotal += unitPrice * quantity;

        return {
          productId: product.id,
          quantity,
          price: unitPrice,
          name: product.name,
        };
      });

      // Zdejmij stan magazynowy — warunek `stock >= quantity` chroni przed
      // sprzedaniem tej samej sztuki dwóm osobom naraz.
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new OrderError(`Produkt "${item.name}" nie jest dostępny w żądanej ilości`);
        }
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const shippingCost =
        subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultShippingCost;
      const total = Math.round((subtotal + shippingCost) * 100) / 100;

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session?.userId ?? null,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          shippingAddress: input.shippingAddress,
          shippingCity: input.shippingCity,
          shippingZip: input.shippingZip,
          notes: input.notes || null,
          subtotal,
          shippingCost,
          total,
          status: "PENDING",
          paymentMethod: isP24Configured() ? "przelewy24" : null,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    // Płatność online (Przelewy24) — gdy skonfigurowana, kierujemy klienta
    // na stronę płatności; w razie problemu zamówienie zostaje jako PENDING.
    let paymentUrl = `/zamowienie/potwierdzenie?order=${encodeURIComponent(order.orderNumber)}`;
    if (isP24Configured()) {
      try {
        paymentUrl = await registerTransaction({
          orderNumber: order.orderNumber,
          totalPln: Number(order.total),
          customerEmail: order.customerEmail,
          customerName: order.customerName,
        });
      } catch (error) {
        console.error("P24: nie udało się zarejestrować transakcji:", error);
      }
    }

    // E-maile (nie blokują odpowiedzi w razie błędu — obsługa wewnątrz lib/email)
    const emailData = toOrderEmailData(order);
    await Promise.all([
      sendOrderConfirmationEmail(emailData),
      sendNewOrderNotification(emailData),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentUrl,
      },
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się utworzyć zamówienia" },
      { status: 500 }
    );
  }
}

// GET /api/orders?orderNumber=...&email=... - Szczegóły zamówienia
// Wymaga podania e-maila zamawiającego — sam numer zamówienia (widoczny
// np. w przekazanym linku) nie wystarcza do odczytu danych osobowych.
export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(`order-lookup:${clientIp(request)}`, 30, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Zbyt wiele zapytań. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, error: "Wymagany numer zamówienia i adres email" },
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
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!order || order.customerEmail.toLowerCase() !== email) {
      return NextResponse.json(
        { success: false, error: "Zamówienie nie zostało znalezione" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się pobrać zamówienia" },
      { status: 500 }
    );
  }
}
