import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  createAutopayItnConfirmation,
  getAutopayConfig,
  isAutopayConfigured,
  parseAutopayItn,
  parseAutopayPaymentDate,
  verifyAutopayItn,
  type AutopayItn,
} from "@/lib/autopay";
import { sendPaymentConfirmedEmail, toOrderEmailData } from "@/lib/email";
import { readBodyWithLimit, RequestSecurityError } from "@/lib/request-security";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { paymentReviewReason } from "@/lib/order-state-rules";
import { paymentValidityTime } from "@/lib/order-security";

const MAX_ITN_BODY_BYTES = 192 * 1024;
const MAX_PAYMENT_CLOCK_SKEW_MS = 5 * 60 * 1000;

function xmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function confirmationResponse(
  notification: Pick<AutopayItn, "serviceId" | "orderId">,
  confirmation: "CONFIRMED" | "NOTCONFIRMED"
) {
  return xmlResponse(createAutopayItnConfirmation(notification, confirmation));
}

class ItnOrderMismatch extends Error {}

// POST /api/payments/autopay/itn
export async function POST(request: Request) {
  if (!isAutopayConfigured()) {
    return xmlResponse("Autopay nieskonfigurowane", 503);
  }

  const limit = rateLimit(`autopay-itn:${clientIp(request)}`, 120, 60 * 1000);
  if (!limit.ok) {
    return xmlResponse("Zbyt wiele żądań", 429);
  }

  let notification: AutopayItn;
  try {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/x-www-form-urlencoded") {
      return xmlResponse("Nieprawidłowy Content-Type", 415);
    }
    const raw = await readBodyWithLimit(request, MAX_ITN_BODY_BYTES);
    const encoded = new URLSearchParams(raw).get("transactions");
    if (!encoded) return xmlResponse("Brak komunikatu transactions", 400);
    notification = parseAutopayItn(encoded);
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return xmlResponse(error.message, error.status);
    }
    console.error("Autopay ITN: odrzucono nieprawidłowy komunikat");
    return xmlResponse("Nieprawidłowy komunikat ITN", 400);
  }

  const config = getAutopayConfig();
  if (!verifyAutopayItn(notification, config)) {
    console.error("Autopay ITN: nieprawidłowy podpis", notification.orderId);
    return confirmationResponse(notification, "NOTCONFIRMED");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber: notification.orderId },
        include: { items: true },
      });

      const expectedAmount = order ? Number(order.total).toFixed(2) : null;
      if (
        !order ||
        order.paymentMethod !== "autopay" ||
        notification.currency !== "PLN" ||
        notification.amount !== expectedAmount
      ) {
        throw new ItnOrderMismatch("Dane ITN nie pasują do zamówienia");
      }

      // MySQL-owy INSERT ... ON DUPLICATE KEY blokuje rekord po RemoteID. Następnie
      // aktualizujemy status monotonicznie: SUCCESS nigdy nie może zostać cofnięty
      // przez spóźnione PENDING/FAILURE, a FAILURE nie wraca do PENDING.
      const paymentTransactionId = randomUUID();
      await tx.$executeRaw`
        INSERT INTO \`autopay_transactions\`
          (\`id\`, \`orderId\`, \`serviceId\`, \`remoteId\`, \`amount\`, \`currency\`,
           \`status\`, \`paymentDate\`, \`paymentStatusDetails\`, \`firstSeenAt\`, \`lastSeenAt\`)
        VALUES
          (${paymentTransactionId}, ${order.id}, ${notification.serviceId}, ${notification.remoteId},
           ${notification.amount}, ${notification.currency}, ${notification.paymentStatus},
           ${notification.paymentDate}, ${notification.paymentStatusDetails ?? null},
           CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE \`lastSeenAt\` = CURRENT_TIMESTAMP(3)
      `;

      const paymentRows = await tx.$queryRaw<
        Array<{ id: string; orderId: string; status: "PENDING" | "SUCCESS" | "FAILURE" }>
      >`
        SELECT \`id\`, \`orderId\`, \`status\`
        FROM \`autopay_transactions\`
        WHERE \`serviceId\` = ${notification.serviceId}
          AND \`remoteId\` = ${notification.remoteId}
        FOR UPDATE
      `;
      const storedPayment = paymentRows[0];
      if (!storedPayment || storedPayment.orderId !== order.id) {
        throw new ItnOrderMismatch("RemoteID jest już przypisane do innego zamówienia");
      }

      const isNewPayment = storedPayment.id === paymentTransactionId;
      const wasSuccessful = storedPayment.status === "SUCCESS" && !isNewPayment;

      const shouldPromote =
        notification.paymentStatus === "SUCCESS"
          ? storedPayment.status !== "SUCCESS"
          : notification.paymentStatus === "FAILURE" && storedPayment.status === "PENDING";
      if (shouldPromote) {
        await tx.autopayTransaction.update({
          where: {
            serviceId_remoteId: {
              serviceId: notification.serviceId,
              remoteId: notification.remoteId,
            },
          },
          data: {
            status: notification.paymentStatus,
            paymentDate: notification.paymentDate,
            paymentStatusDetails: notification.paymentStatusDetails,
          },
        });
      }

      if (notification.paymentStatus !== "SUCCESS") {
        return { emailOrder: null, reviewReason: null };
      }

      // Cała pierwsza obsługa SUCCESS (zmiana transakcji, zamówienia i utworzenie
      // ewentualnej sprawy) jest jedną transakcją DB. Dlatego retransmisja już
      // zapisanego SUCCESS nie może ponownie otworzyć rozstrzygniętej sprawy.
      if (wasSuccessful) {
        const linkedReview = await tx.paymentReviewCase.findFirst({
          where: { autopayTransactionId: storedPayment.id, resolvedAt: null },
          select: { reason: true, resolvedAt: true },
          orderBy: { createdAt: "desc" },
        });
        return {
          emailOrder: null,
          reviewReason: linkedReview && !linkedReview.resolvedAt ? linkedReview.reason : null,
        };
      }

      const receivedAt = new Date();
      const authorizationTime = parseAutopayPaymentDate(notification.paymentDate);
      const paymentDateOutsideOrderWindow =
        authorizationTime.getTime() < order.createdAt.getTime() - MAX_PAYMENT_CLOCK_SKEW_MS ||
        authorizationTime.getTime() > receivedAt.getTime() + MAX_PAYMENT_CLOCK_SKEW_MS;
      const timingReviewReason =
        order.status === "PENDING" && !order.paidAt
          ? paymentDateOutsideOrderWindow
            ? "PAYMENT_DATE_OUTSIDE_ORDER_WINDOW"
            : !order.reservationExpiresAt
            ? "LEGACY_PENDING_REQUIRES_RECONCILIATION"
            : authorizationTime > paymentValidityTime(order.reservationExpiresAt)
              ? "PAYMENT_AUTHORIZED_AFTER_VALIDITY"
              : receivedAt >= order.reservationExpiresAt
                ? "LATE_PAYMENT_AFTER_STOCK_RELEASE"
                : null
          : null;
      const claimed = timingReviewReason
        ? { count: 0 }
        : await tx.order.updateMany({
            where: {
              id: order.id,
              status: "PENDING",
              paidAt: null,
              stockReleasedAt: null,
              reservationExpiresAt: { gt: receivedAt },
            },
            data: {
              status: "PAID",
              paidAt: authorizationTime,
              paymentId: notification.remoteId,
              version: { increment: 1 },
            },
          });

      if (claimed.count === 1) {
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING",
            toStatus: "PAID",
            actorType: "AUTOPAY",
            actorId: notification.remoteId,
            reason: "ITN_SUCCESS",
          },
        });
        const emailOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
        return { emailOrder, reviewReason: null };
      }

      // To jest blokujący/current read, a nie snapshot z początku transakcji.
      // Dzięki temu poprawnie widzimy wynik wyścigu z anulowaniem, expirerem
      // albo innym SUCCESS i nigdy nie potwierdzamy płatności "w ciemno".
      const currentRows = await tx.$queryRaw<
        Array<{
          paymentId: string | null;
          paidAt: Date | null;
          status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
          stockReleasedAt: Date | null;
        }>
      >`
        SELECT \`paymentId\`, \`paidAt\`, \`status\`, \`stockReleasedAt\`
        FROM \`orders\`
        WHERE \`id\` = ${order.id}
        FOR UPDATE
      `;
      const current = currentRows[0];
      if (!current) throw new Error("Zamówienie zniknęło podczas obsługi ITN");

      const isProvenRetransmission = Boolean(
        current.paidAt &&
          current.paymentId === notification.remoteId &&
          ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(current.status)
      );
      const reviewReason = isProvenRetransmission
        ? null
        : timingReviewReason ||
          paymentReviewReason(current, notification.remoteId) ||
          "UNEXPECTED_ORDER_STATE";

      if (reviewReason) {
        // Migracja mogła już utworzyć nierozstrzygniętą albo rozstrzygniętą
        // sprawę zwrotu bez rekordu AutopayTransaction. Pierwszy późniejszy ITN
        // tego samego RemoteID dołącza się do niej zamiast tworzyć drugi zwrot.
        // Locking read jest celowy: zwykłe findFirst pod MySQL REPEATABLE READ
        // mogłoby nie zobaczyć sprawy utworzonej przez anulowanie po rozpoczęciu
        // tej transakcji, ale przed zdobyciem blokady zamówienia.
        const migratedRefundRows = await tx.$queryRaw<
          Array<{ id: string; reason: string; resolvedAt: Date | null }>
        >`
          SELECT \`id\`, \`reason\`, \`resolvedAt\`
          FROM \`payment_review_cases\`
          WHERE \`orderId\` = ${order.id}
            AND \`autopayTransactionId\` IS NULL
            AND \`kind\` = 'ORDER_CANCELLATION_REFUND'
            AND \`remoteId\` = ${notification.remoteId}
            AND \`reason\` = 'PAID_ORDER_CANCELLED_REFUND_REQUIRED'
          ORDER BY \`createdAt\` ASC
          LIMIT 1
          FOR UPDATE
        `;
        const migratedRefund = migratedRefundRows[0];
        if (migratedRefund) {
          await tx.paymentReviewCase.update({
            where: { id: migratedRefund.id },
            data: {
              autopayTransactionId: storedPayment.id,
              dedupeKey: `ITN:${storedPayment.id}`,
            },
          });
          await tx.order.update({
            where: { id: order.id },
            data: {
              ...(migratedRefund.resolvedAt
                ? {}
                : {
                    paymentReviewRequired: true,
                    paymentReviewReason: migratedRefund.reason,
                  }),
              version: { increment: 1 },
            },
          });
          return {
            emailOrder: null,
            reviewReason: migratedRefund.resolvedAt ? null : migratedRefund.reason,
          };
        }

        await tx.paymentReviewCase.create({
          data: {
            orderId: order.id,
            autopayTransactionId: storedPayment.id,
            kind: "ITN_RECONCILIATION",
            dedupeKey: `ITN:${storedPayment.id}`,
            remoteId: notification.remoteId,
            reason: reviewReason,
          },
        });
        // Inkrementujemy wersję także wtedy, gdy inna sprawa była już otwarta.
        // Otwarty formularz administratora nie może wówczas ukryć nowej wpłaty.
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentReviewRequired: true,
            paymentReviewReason: reviewReason,
            version: { increment: 1 },
          },
        });
      }
      return { emailOrder: null, reviewReason };
    });

    if (result.reviewReason) {
      console.error(
        "Autopay ITN: płatność wymaga ręcznego uzgodnienia",
        notification.orderId,
        result.reviewReason
      );
    }
    if (result.emailOrder) {
      await sendPaymentConfirmedEmail(toOrderEmailData(result.emailOrder));
    }
    return confirmationResponse(notification, "CONFIRMED");
  } catch (error) {
    if (error instanceof ItnOrderMismatch) {
      console.error("Autopay ITN: dane nie pasują do zamówienia", notification.orderId);
      return confirmationResponse(notification, "NOTCONFIRMED");
    }
    console.error("Autopay ITN: błąd obsługi powiadomienia", notification.orderId, error);
    return xmlResponse("Błąd serwera", 500);
  }
}
