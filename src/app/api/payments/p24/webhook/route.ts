import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  isP24Configured,
  verifyNotificationSign,
  verifyTransaction,
  type P24Notification,
} from "@/lib/p24";
import { sendPaymentConfirmedEmail, toOrderEmailData } from "@/lib/email";

// POST /api/payments/p24/webhook
// Powiadomienie o płatności z Przelewy24 (urlStatus).
// Bezpieczeństwo: podpis sha384 z kluczem CRC + weryfikacja transakcji
// w API P24 — nie ufamy samemu żądaniu HTTP.
export async function POST(request: NextRequest) {
  if (!isP24Configured()) {
    return NextResponse.json({ error: "P24 nieskonfigurowane" }, { status: 503 });
  }

  try {
    const notification = (await request.json().catch(() => null)) as P24Notification | null;

    if (
      !notification ||
      typeof notification.sessionId !== "string" ||
      typeof notification.orderId !== "number" ||
      typeof notification.amount !== "number" ||
      typeof notification.sign !== "string"
    ) {
      return NextResponse.json({ error: "Nieprawidłowe powiadomienie" }, { status: 400 });
    }

    if (!verifyNotificationSign(notification)) {
      console.error("P24 webhook: nieprawidłowy podpis", notification.sessionId);
      return NextResponse.json({ error: "Nieprawidłowy podpis" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: notification.sessionId },
      include: { items: true },
    });

    if (!order) {
      console.error("P24 webhook: nieznane zamówienie", notification.sessionId);
      return NextResponse.json({ error: "Nieznane zamówienie" }, { status: 404 });
    }

    // Idempotencja — P24 może ponawiać powiadomienia
    if (order.paidAt) {
      return NextResponse.json({ status: "OK" });
    }

    // Kwota z powiadomienia musi zgadzać się z zamówieniem (grosze)
    const expectedAmount = Math.round(Number(order.total) * 100);
    if (notification.amount !== expectedAmount) {
      console.error(
        `P24 webhook: niezgodna kwota dla ${order.orderNumber} (oczekiwano ${expectedAmount}, otrzymano ${notification.amount})`
      );
      return NextResponse.json({ error: "Niezgodna kwota" }, { status: 400 });
    }

    const verified = await verifyTransaction({
      sessionId: notification.sessionId,
      orderId: notification.orderId,
      amount: notification.amount,
    });

    if (!verified) {
      console.error("P24 webhook: weryfikacja transakcji nie powiodła się", order.orderNumber);
      return NextResponse.json({ error: "Weryfikacja nie powiodła się" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentId: String(notification.orderId),
        paymentMethod: "przelewy24",
      },
      include: { items: true },
    });

    await sendPaymentConfirmedEmail(toOrderEmailData(updated));

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("P24 webhook: błąd obsługi powiadomienia:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
