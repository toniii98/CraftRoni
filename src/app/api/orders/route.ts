import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createOrderSchema, firstZodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getShopSettings } from "@/lib/settings";
import { isAutopayConfigured } from "@/lib/autopay";
import { isCheckoutEnabled, publicAppOrigin } from "@/lib/runtime-env";
import {
  checkoutRequestHash,
  derivePaymentAccessToken,
  generateOrderNumber,
  hashCheckoutKey,
  isValidCheckoutKey,
  MAX_QUANTITY_PER_PRODUCT,
  MAX_ORDER_TOTAL_PLN,
  MAX_TOTAL_QUANTITY,
  paymentValidityTime,
  reservationExpiry,
  TERMS_VERSION,
} from "@/lib/order-security";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import { releaseExpiredReservations } from "@/lib/order-state";
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotification,
  toOrderEmailData,
} from "@/lib/email";

class OrderError extends Error {}

function orderResponse(order: { orderNumber: string }, paymentAccessToken: string) {
  const paymentUrl = paymentStartPath(order.orderNumber, paymentAccessToken);
  return NextResponse.json(
    {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentUrl,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function paymentStartPath(orderNumber: string, paymentAccessToken: string): string {
  const query = new URLSearchParams({ order: orderNumber, token: paymentAccessToken });
  return `/api/payments/autopay/start?${query.toString()}`;
}

function replayOrderResponse(
  order: {
    orderNumber: string;
    status: string;
    checkoutRequestHash: string | null;
    reservationExpiresAt: Date | null;
    stockReleasedAt: Date | null;
  },
  paymentAccessToken: string,
  requestHash: string
) {
  if (order.checkoutRequestHash !== requestHash) {
    return NextResponse.json(
      { success: false, error: "Ten klucz checkoutu został użyty dla innych danych" },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  const reservationInactive =
    order.status === "CANCELLED" ||
    Boolean(order.stockReleasedAt) ||
    (order.status === "PENDING" &&
      (!order.reservationExpiresAt || order.reservationExpiresAt <= new Date()));
  if (reservationInactive) {
    return NextResponse.json(
      {
        success: false,
        error: "Poprzednia rezerwacja wygasła. Wyślij zamówienie ponownie.",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (
    order.status === "PENDING" &&
    order.reservationExpiresAt &&
    paymentValidityTime(order.reservationExpiresAt) <= new Date()
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Okno płatności minęło, ale nadal czekamy na końcowe potwierdzenie. Nie wysyłaj ponownie płatności.",
      },
      { status: 425, headers: { "Cache-Control": "no-store" } }
    );
  }

  return orderResponse(order, paymentAccessToken);
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "P2002"
  );
}

// POST /api/orders - utworzenie jednej, czasowej rezerwacji magazynu.
export async function POST(request: NextRequest) {
  let checkoutKeyHash = "";
  let requestHash = "";
  let checkoutKey = "";
  let paymentAccessToken = "";

  try {
    if (!isCheckoutEnabled()) {
      return NextResponse.json(
        { success: false, error: "Składanie zamówień jest tymczasowo wyłączone" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!isAutopayConfigured()) {
      return NextResponse.json(
        { success: false, error: "Płatności online nie są jeszcze skonfigurowane" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const limit = rateLimit(`orders:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Zbyt wiele zamówień. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    checkoutKey = request.headers.get("idempotency-key")?.trim() || "";
    if (!isValidCheckoutKey(checkoutKey)) {
      return NextResponse.json(
        { success: false, error: "Brak prawidłowego klucza idempotencji checkoutu" },
        { status: 400 }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 64 * 1024);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;
    checkoutKeyHash = hashCheckoutKey(checkoutKey);
    requestHash = checkoutRequestHash(input);
    paymentAccessToken = derivePaymentAccessToken(checkoutKeyHash);

    // Sprzątanie jest oportunistyczne; produkcja uruchamia też orders:expire z crona.
    await releaseExpiredReservations(25).catch((error) => {
      console.error("Nie udało się oportunistycznie wygasić rezerwacji", error);
    });

    const previous = await prisma.order.findUnique({ where: { checkoutKeyHash } });
    if (previous) {
      return replayOrderResponse(previous, paymentAccessToken, requestHash);
    }

    const quantities = new Map<string, number>();
    for (const item of input.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }
    const totalQuantity = [...quantities.values()].reduce((sum, quantity) => sum + quantity, 0);
    if (
      totalQuantity > MAX_TOTAL_QUANTITY ||
      [...quantities.values()].some((quantity) => quantity > MAX_QUANTITY_PER_PRODUCT)
    ) {
      return NextResponse.json(
        { success: false, error: "Przekroczono dozwoloną liczbę sztuk w zamówieniu" },
        { status: 400 }
      );
    }

    const productIds = [...quantities.keys()];
    const settings = await getShopSettings();
    const session = await getSession();
    const expiresAt = reservationExpiry();

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
          category: { isActive: true },
        },
        orderBy: { id: "asc" },
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
        return { productId: product.id, quantity, price: unitPrice, name: product.name };
      });

      for (const item of orderItems) {
        const snapshot = products.find((product) => product.id === item.productId)!;
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
            stockVersion: snapshot.stockVersion,
            isActive: true,
            category: { isActive: true },
          },
          data: {
            stock: { decrement: item.quantity },
            stockVersion: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          throw new OrderError(
            `Produkt "${item.name}" został w międzyczasie zmieniony lub nie jest dostępny`
          );
        }
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const shippingCost =
        subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultShippingCost;
      const total = Math.round((subtotal + shippingCost) * 100) / 100;
      if (!Number.isFinite(total) || total > MAX_ORDER_TOTAL_PLN) {
        throw new OrderError("Wartość zamówienia przekracza obsługiwany limit");
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session?.userId ?? null,
          checkoutKeyHash,
          checkoutRequestHash: requestHash,
          reservationExpiresAt: expiresAt,
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
          customerEmail: input.customerEmail.trim().toLowerCase(),
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
          paymentMethod: "autopay",
          items: { create: orderItems },
          statusEvents: {
            create: {
              toStatus: "PENDING",
              actorType: session ? "CUSTOMER" : "GUEST",
              actorId: session?.userId,
              reason: "CHECKOUT_CREATED",
            },
          },
        },
        include: { items: true },
      });
    });

    const emailData = {
      ...toOrderEmailData(order),
      paymentUrl: `${publicAppOrigin()}${paymentStartPath(order.orderNumber, paymentAccessToken)}`,
    };
    await Promise.all([sendOrderConfirmationEmail(emailData), sendNewOrderNotification(emailData)]);
    return orderResponse(order, paymentAccessToken);
  } catch (error) {
    if (isUniqueConstraintError(error) && checkoutKeyHash) {
      const previous = await prisma.order.findUnique({ where: { checkoutKeyHash } });
      if (previous) {
        return replayOrderResponse(previous, paymentAccessToken, requestHash);
      }
    }
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
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
