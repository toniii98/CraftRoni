import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { ClaimOrderButton } from "@/components/account/ClaimOrderButton";

const statusLabels: Record<string, string> = {
  PENDING: "Oczekujące",
  PAID: "Opłacone",
  PROCESSING: "W realizacji",
  SHIPPED: "Wysłane",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [orders, matchedOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        userId: null,
        matchedUserId: user.id,
        accountLinkStatus: "MATCHED_BY_EMAIL",
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Moje zamówienia</h2>
        <p className="mt-2 text-muted">Śledź przypisane zamówienia oraz odzyskaj zakupy zrobione bez logowania.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Zamówienia przypisane do konta</h3>
          <Link href="/sklep" className="text-sm font-medium text-primary hover:text-primary-dark">
            Zrób kolejne zakupy
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted">
            Nie masz jeszcze żadnych zamówień przypisanych do konta.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("pl-PL")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatPrice(Number(order.total))}</p>
                    <p className="text-sm text-muted">{statusLabels[order.status] || order.status}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{order.items.length} pozycji w zamówieniu</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Zakupy gościnne dopasowane po emailu</h3>
        {matchedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted">
            Nie wykryto zakupów gościnnych do przypisania.
          </div>
        ) : (
          <div className="space-y-4">
            {matchedOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="text-sm text-muted">Email: {order.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatPrice(Number(order.total))}</p>
                    <p className="text-sm text-primary">Zakup bez logowania</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">Dopasowaliśmy to zamówienie po adresie email. Potwierdź, aby przypisać je do konta.</p>
                <div className="mt-4">
                  <ClaimOrderButton orderId={order.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
