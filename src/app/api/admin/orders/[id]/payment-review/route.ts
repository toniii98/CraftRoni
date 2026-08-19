import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  firstZodMessage,
  paymentReviewResolutionSchema,
} from "@/lib/validation";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import { sendPaymentConfirmedEmail, toOrderEmailData } from "@/lib/email";
import { paymentReviewResolutionPlan } from "@/lib/order-state-rules";
import { parseAutopayPaymentDate } from "@/lib/autopay";

class ReviewResolutionError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

type LockedOrder = {
  id: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  version: number;
  stockReleasedAt: Date | null;
  paidAt: Date | null;
  paymentId: string | null;
};

type LockedPayment = {
  id: string;
  orderId: string;
  remoteId: string;
  status: "PENDING" | "SUCCESS" | "FAILURE";
  paymentDate: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = paymentReviewResolutionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const {
      reviewCaseId,
      resolution,
      reference,
      expectedStatus,
      expectedVersion,
    } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const reviewCase = await tx.paymentReviewCase.findFirst({
        where: { id: reviewCaseId, orderId: id },
        include: { autopayTransaction: { select: { remoteId: true } } },
      });
      if (!reviewCase) throw new ReviewResolutionError("Sprawa płatnicza nie istnieje", 404);

      // ITN blokuje w kolejności Transaction -> Order. Zachowujemy tę samą
      // kolejność, a magazyn dotykamy dopiero po zablokowaniu zamówienia.
      let lockedPayment: LockedPayment | null = null;
      if (reviewCase.autopayTransactionId) {
        const lockedPayments = await tx.$queryRaw<LockedPayment[]>`
          SELECT \`id\`, \`orderId\`, \`remoteId\`, \`status\`, \`paymentDate\`
          FROM \`autopay_transactions\`
          WHERE \`id\` = ${reviewCase.autopayTransactionId}
          FOR UPDATE
        `;
        lockedPayment = lockedPayments[0] ?? null;
        if (!lockedPayment || lockedPayment.orderId !== id || lockedPayment.status !== "SUCCESS") {
          throw new ReviewResolutionError("Powiązana transakcja Autopay nie istnieje", 409);
        }
      }

      const orderRows = await tx.$queryRaw<LockedOrder[]>`
        SELECT \`id\`, \`status\`, \`version\`, \`stockReleasedAt\`, \`paidAt\`, \`paymentId\`
        FROM \`orders\`
        WHERE \`id\` = ${id}
        FOR UPDATE
      `;
      const current = orderRows[0];
      if (!current) throw new ReviewResolutionError("Zamówienie nie znalezione", 404);

      if (
        reviewCase.resolvedAt ||
        current.status !== expectedStatus ||
        current.version !== expectedVersion
      ) {
        throw new ReviewResolutionError(
          "Sprawa lub zamówienie zmieniły się. Odśwież widok przed rozstrzygnięciem.",
          409
        );
      }

      const isLegacy =
        reviewCase.kind === "LEGACY_RECONCILIATION" &&
        reviewCase.reason === "LEGACY_PENDING_REQUIRES_RECONCILIATION" &&
        !reviewCase.autopayTransactionId;
      if (resolution === "NO_PAYMENT_FOUND" && !isLegacy) {
        throw new ReviewResolutionError(
          "Brak płatności można potwierdzić tylko dla starego zamówienia wymagającego uzgodnienia."
        );
      }

      if (
        resolution === "PAYMENT_ACCEPTED" &&
        (!lockedPayment || reviewCase.kind !== "ITN_RECONCILIATION")
      ) {
        throw new ReviewResolutionError(
          "Płatność można przyjąć tylko w sprawie uzgodnienia zapisanej, podpisanej wiadomości ITN."
        );
      }

      const plan = paymentReviewResolutionPlan(
        current.status,
        Boolean(current.stockReleasedAt),
        resolution
      );
      if (!plan) {
        throw new ReviewResolutionError(
          "To zamówienie jest już w realizacji. Dodatkową wpłatę można wyłącznie zwrócić."
        );
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        orderBy: { productId: "asc" },
      });
      let nextStockReleasedAt = current.stockReleasedAt;

      if (plan.reserveStock) {
        for (const item of items) {
          const reserved = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: {
              stock: { decrement: item.quantity },
              stockVersion: { increment: 1 },
            },
          });
          if (reserved.count !== 1) {
            throw new ReviewResolutionError(
              `Brak zapasu produktu „${item.name}”. Nie można przyjąć płatności bez ponownej rezerwacji.`,
              409
            );
          }
        }
        nextStockReleasedAt = null;
      } else if (plan.releaseStock) {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              stockVersion: { increment: 1 },
            },
          });
        }
        nextStockReleasedAt = new Date();
      }

      const resolvedAt = new Date();
      const resolved = await tx.paymentReviewCase.updateMany({
        where: { id: reviewCase.id, orderId: id, resolvedAt: null },
        data: {
          resolvedAt,
          resolvedBy: session.userId,
          resolution,
          reference,
        },
      });
      if (resolved.count !== 1) {
        throw new ReviewResolutionError("Sprawa została już rozstrzygnięta. Odśwież widok.", 409);
      }

      const remainingReview = await tx.paymentReviewCase.findFirst({
        where: { orderId: id, resolvedAt: null },
        select: { reason: true },
        orderBy: { createdAt: "desc" },
      });
      const updated = await tx.order.updateMany({
        where: { id, status: expectedStatus, version: expectedVersion },
        data: {
          status: plan.nextStatus,
          stockReleasedAt: nextStockReleasedAt,
          ...(resolution === "PAYMENT_ACCEPTED"
            ? {
                paidAt: parseAutopayPaymentDate(lockedPayment!.paymentDate),
                paymentId: lockedPayment!.remoteId,
              }
            : {}),
          paymentReviewRequired: Boolean(remainingReview),
          paymentReviewReason: remainingReview?.reason ?? null,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new ReviewResolutionError(
          "Zamówienie zostało równolegle zmienione. Odśwież widok.",
          409
        );
      }

      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          fromStatus: current.status,
          toStatus: plan.nextStatus,
          actorType: "ADMIN",
          actorId: session.userId,
          reason: `PAYMENT_REVIEW_${resolution}`,
        },
      });

      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error("Zamówienie zniknęło po rozstrzygnięciu sprawy");
      return order;
    });

    if (resolution === "PAYMENT_ACCEPTED") {
      await sendPaymentConfirmedEmail(toOrderEmailData(result));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ReviewResolutionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Błąd rozstrzygnięcia sprawy płatniczej", error);
    return NextResponse.json({ error: "Nie udało się rozstrzygnąć sprawy" }, { status: 500 });
  }
}
