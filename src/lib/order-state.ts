import prisma from "./prisma";

export async function releaseExpiredReservations(limit = 50): Promise<number> {
  const now = new Date();
  const candidates = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paidAt: null,
      stockReleasedAt: null,
      reservationExpiresAt: { lte: now },
    },
    select: { id: true },
    orderBy: { reservationExpiresAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
  });

  let released = 0;
  for (const candidate of candidates) {
    const didRelease = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: candidate.id },
        include: { items: true },
      });
      if (!order) return false;

      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          version: order.version,
          status: "PENDING",
          paidAt: null,
          stockReleasedAt: null,
          reservationExpiresAt: { lte: now },
        },
        data: {
          status: "CANCELLED",
          stockReleasedAt: now,
          version: { increment: 1 },
        },
      });
      if (claimed.count !== 1) return false;

      for (const item of [...order.items].sort((a, b) =>
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
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          actorType: "SYSTEM",
          reason: "RESERVATION_EXPIRED",
        },
      });
      return true;
    });
    if (didRelease) released += 1;
  }
  return released;
}
