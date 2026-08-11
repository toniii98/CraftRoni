import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createAutopayItnConfirmation,
  getAutopayConfig,
  isAutopayConfigured,
  parseAutopayItn,
  verifyAutopayItn,
  type AutopayItn,
} from "@/lib/autopay";
import { sendPaymentConfirmedEmail, toOrderEmailData } from "@/lib/email";

function xmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function confirmationResponse(
  notification: Pick<AutopayItn, "serviceId" | "orderId">,
  confirmation: "CONFIRMED" | "NOTCONFIRMED"
) {
  return xmlResponse(createAutopayItnConfirmation(notification, confirmation));
}

// POST /api/payments/autopay/itn
// Autopay wysyła formularz z polem `transactions`: Base64(XML).
// Każdy komunikat jest uwierzytelniany hashem, a status SUCCESS jest dodatkowo
// sprawdzany względem kwoty, waluty i danych zamówienia zapisanych w bazie.
export async function POST(request: Request) {
  if (!isAutopayConfigured()) {
    return xmlResponse("Autopay nieskonfigurowane", 503);
  }

  let notification: AutopayItn;
  try {
    const formData = await request.formData();
    const encoded = formData.get("transactions");
    if (typeof encoded !== "string") {
      return xmlResponse("Brak komunikatu transactions", 400);
    }
    notification = parseAutopayItn(encoded);
  } catch (error) {
    console.error("Autopay ITN: nieprawidłowy komunikat:", error);
    return xmlResponse("Nieprawidłowy komunikat ITN", 400);
  }

  const config = getAutopayConfig();
  if (!verifyAutopayItn(notification, config)) {
    console.error("Autopay ITN: nieprawidłowy podpis", notification.orderId);
    return confirmationResponse(notification, "NOTCONFIRMED");
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: notification.orderId },
      include: { items: true },
    });

    const expectedAmount = order ? Number(order.total).toFixed(2) : null;
    const matchesOrder =
      order &&
      order.paymentMethod === "autopay" &&
      notification.currency === "PLN" &&
      notification.amount === expectedAmount;

    if (!matchesOrder) {
      console.error("Autopay ITN: dane nie pasują do zamówienia", notification.orderId);
      return confirmationResponse(notification, "NOTCONFIRMED");
    }

    // PENDING i FAILURE potwierdzamy operatorowi, ale nie zmieniamy nimi
    // zamówienia. W szczególności późniejszy FAILURE innego RemoteID nie może
    // cofnąć wcześniej potwierdzonej płatności.
    if (notification.paymentStatus !== "SUCCESS") {
      return confirmationResponse(notification, "CONFIRMED");
    }

    // Warunek paidAt=null zapewnia idempotencję również przy równoległych
    // ponowieniach ITN. E-mail wysyła tylko proces, który faktycznie zmienił rekord.
    const updated = await prisma.order.updateMany({
      where: { id: order.id, paidAt: null, status: { not: "CANCELLED" } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentId: notification.remoteId,
        paymentMethod: "autopay",
      },
    });

    if (updated.count === 1) {
      const paidOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      if (paidOrder) {
        await sendPaymentConfirmedEmail(toOrderEmailData(paidOrder));
      }
    } else {
      // Płatność może dotrzeć po ręcznym anulowaniu zamówienia. Zapisujemy ją,
      // ale nie przywracamy zamówienia automatycznie, bo stan mógł już zostać
      // sprzedany. Taka płatność wymaga decyzji administratora/zwrotu.
      const cancelledPayment = await prisma.order.updateMany({
        where: { id: order.id, paidAt: null, status: "CANCELLED" },
        data: {
          paidAt: new Date(),
          paymentId: notification.remoteId,
          paymentMethod: "autopay",
        },
      });
      if (cancelledPayment.count === 1) {
        console.error(
          "Autopay ITN: opłacono anulowane zamówienie — wymagany ręczny zwrot",
          notification.orderId
        );
      }
    }

    return confirmationResponse(notification, "CONFIRMED");
  } catch (error) {
    // Błąd serwera zwracamy jako 500, aby Autopay ponowiło ITN.
    console.error("Autopay ITN: błąd obsługi powiadomienia:", error);
    return xmlResponse("Błąd serwera", 500);
  }
}
