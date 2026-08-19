import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { orderUpdateSchema, firstZodMessage } from "@/lib/validation";
import { sendOrderShippedEmail, toOrderEmailData } from "@/lib/email";
import { readJsonWithLimit, RequestSecurityError } from "@/lib/request-security";
import { isAllowedAdminTransition } from "@/lib/order-state-rules";

class OrderStateError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

function serializeOrder<T extends {
  subtotal: unknown;
  shippingCost: unknown;
  total: unknown;
  items: Array<{ price: unknown }>;
}>(order: T) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, price: Number(item.price) })),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: { take: 1 } },
            },
          },
        },
        user: { select: { id: true, email: true, name: true } },
        autopayTransactions: { orderBy: { firstSeenAt: "desc" } },
        paymentReviews: { orderBy: { createdAt: "desc" } },
        statusEvents: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
    if (!order) return NextResponse.json({ error: "Zamówienie nie znalezione" }, { status: 404 });
    return NextResponse.json(
      { order: serializeOrder(order) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Błąd pobierania zamówienia:", error);
    return NextResponse.json({ error: "Błąd pobierania zamówienia" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await readJsonWithLimit<unknown>(request, 64 * 1024);
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { status, notes, expectedStatus, expectedVersion } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new OrderStateError("Zamówienie nie znalezione", 404);
      if (current.status !== expectedStatus || current.version !== expectedVersion) {
        throw new OrderStateError(
          "Zamówienie zmieniło się od czasu otwarcia formularza. Odśwież widok i sprawdź płatność.",
          409
        );
      }

      const changesStatus = Boolean(status && status !== current.status);
      if (changesStatus && !isAllowedAdminTransition(current.status, status!)) {
        if (status === "PAID" && current.paymentMethod === "autopay") {
          throw new OrderStateError("Płatność Autopay może potwierdzić wyłącznie poprawny ITN");
        }
        throw new OrderStateError(
          `Niedozwolona zmiana statusu: ${current.status} → ${status}`
        );
      }

      let nextNotes: string | undefined;
      if (notes) {
        const stamp = new Date().toLocaleString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const entry = `[${stamp}] ${notes}`;
        nextNotes = current.notes ? `${current.notes}\n${entry}` : entry;
      }

      const cancelling = status === "CANCELLED" && current.status !== "CANCELLED";
      const requiresRefund = cancelling && Boolean(current.paidAt);
      let refundPaymentTransactionId: string | null = null;
      if (requiresRefund && current.paymentId) {
        // ITN i review blokują Transaction -> Order. Robimy to samo przed CAS
        // zamówienia, aby audyt zwrotu miał pełne dane i nie tworzył deadlocku.
        const paymentRows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT \`id\`
          FROM \`autopay_transactions\`
          WHERE \`orderId\` = ${id}
            AND \`remoteId\` = ${current.paymentId}
            AND \`status\` = 'SUCCESS'
          ORDER BY \`firstSeenAt\` DESC
          LIMIT 1
          FOR UPDATE
        `;
        refundPaymentTransactionId = paymentRows[0]?.id ?? null;
      }
      const claimed = await tx.order.updateMany({
        where: { id, version: expectedVersion, status: expectedStatus },
        data: {
          ...(changesStatus ? { status } : {}),
          ...(nextNotes !== undefined ? { notes: nextNotes } : {}),
          ...(cancelling && !current.stockReleasedAt ? { stockReleasedAt: new Date() } : {}),
          ...(requiresRefund
            ? {
                paymentReviewRequired: true,
                paymentReviewReason: "PAID_ORDER_CANCELLED_REFUND_REQUIRED",
              }
            : {}),
          version: { increment: 1 },
        },
      });
      if (claimed.count !== 1) {
        throw new OrderStateError(
          "Zamówienie zostało równolegle zmienione. Odśwież widok i spróbuj ponownie.",
          409
        );
      }

      if (requiresRefund) {
        await tx.paymentReviewCase.create({
          data: {
            orderId: id,
            autopayTransactionId: refundPaymentTransactionId,
            kind: "ORDER_CANCELLATION_REFUND",
            dedupeKey: `ADMIN_CANCEL:${id}:${expectedVersion}`,
            remoteId: current.paymentId,
            reason: "PAID_ORDER_CANCELLED_REFUND_REQUIRED",
          },
        });
      }

      if (cancelling && !current.stockReleasedAt) {
        for (const item of [...current.items].sort((a, b) =>
          a.productId.localeCompare(b.productId)
        )) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              stockVersion: { increment: 1 },
            },
          });
        }
      }
      if (changesStatus) {
        await tx.orderStatusEvent.create({
          data: {
            orderId: id,
            fromStatus: current.status,
            toStatus: status!,
            actorType: "ADMIN",
            actorId: session.userId,
            reason: notes || "ADMIN_STATUS_CHANGE",
          },
        });
      }

      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error("Zamówienie zniknęło po aktualizacji");
      return { order, previousStatus: current.status, changesStatus };
    });

    if (result.changesStatus && result.order.status === "SHIPPED") {
      await sendOrderShippedEmail(toOrderEmailData(result.order));
    }
    return NextResponse.json(
      { order: serializeOrder(result.order) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof OrderStateError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Błąd aktualizacji zamówienia:", error);
    return NextResponse.json({ error: "Błąd aktualizacji zamówienia" }, { status: 500 });
  }
}
