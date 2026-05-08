import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const formatPrice = (price: number) => `${price.toFixed(2).replace(".", ",")} zł`;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      matchedGuestOrders: {
        where: { userId: null, accountLinkStatus: "MATCHED_BY_EMAIL" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/zamowienia" className="text-sm text-primary hover:text-primary-dark">
          ← Powrót do zamówień
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Klient: {user.profile?.fullName || user.name || user.email}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-semibold text-foreground">Profil</h2>
          <div className="mt-4 space-y-2 text-sm text-foreground">
            <p><strong>Rola:</strong> {user.role}</p>
            <p><strong>Telefon:</strong> {user.profile?.phone || "—"}</p>
            <p><strong>Zapisane adresy:</strong> {user.addresses.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="font-semibold text-foreground">Adresy</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {user.addresses.length === 0 ? (
              <p className="text-sm text-muted">Klient nie zapisał jeszcze adresów.</p>
            ) : (
              user.addresses.map((address) => (
                <div key={address.id} className="rounded-lg border border-border p-4 text-sm text-foreground">
                  <p className="font-medium">{address.label || "Adres dostawy"}{address.isDefault ? " (domyślny)" : ""}</p>
                  <p>{address.recipientName}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{address.postalCode} {address.city}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Zamówienia przypisane do konta</h2>
        <div className="space-y-4">
          {user.orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted">Brak przypisanych zamówień.</div>
          ) : (
            user.orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-surface p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted">{order.items.length} pozycji • status {order.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatPrice(Number(order.total))}</p>
                  <Link href={`/admin/zamowienia/${order.id}`} className="text-sm text-primary hover:text-primary-dark">Zobacz</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Dopasowane zakupy gościnne</h2>
        <div className="space-y-4">
          {user.matchedGuestOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted">Brak dopasowanych zakupów gościnnych.</div>
          ) : (
            user.matchedGuestOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted">{order.customerEmail} • {order.items.length} pozycji</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatPrice(Number(order.total))}</p>
                  <Link href={`/admin/zamowienia/${order.id}`} className="text-sm text-primary hover:text-primary-dark">Zobacz</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
