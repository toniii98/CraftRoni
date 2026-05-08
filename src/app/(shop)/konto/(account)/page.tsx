import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui";

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [ordersCount, matchedOrdersCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({
      where: {
        userId: null,
        matchedUserId: user.id,
        accountLinkStatus: "MATCHED_BY_EMAIL",
      },
    }),
  ]);

  const defaultAddress = user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Email</p>
          <p className="mt-2 font-semibold text-foreground">{user.email}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Zamówienia na koncie</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{ordersCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Zakupy gościnne do przypisania</p>
          <p className="mt-2 text-2xl font-bold text-primary">{matchedOrdersCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Domyślny adres dostawy</h2>
            {defaultAddress ? (
              <div className="mt-3 text-sm text-foreground">
                <p>{defaultAddress.recipientName}</p>
                <p>{defaultAddress.line1}</p>
                {defaultAddress.line2 && <p>{defaultAddress.line2}</p>}
                <p>{defaultAddress.postalCode} {defaultAddress.city}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Nie masz jeszcze zapisanego adresu.</p>
            )}
          </div>
          <Link href="/konto/adresy">
            <Button variant="outline">Zarządzaj adresami</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Szybkie akcje</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/konto/dane">
            <Button variant="outline">Edytuj dane konta</Button>
          </Link>
          <Link href="/konto/zamowienia">
            <Button>Moje zamówienia</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
