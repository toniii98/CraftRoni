import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, User, ShoppingBag } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui";
import { AccountLogoutButton } from "@/components/shop/AccountLogoutButton";

export const metadata: Metadata = {
  title: "Moje konto",
  description: "Twoje konto i historia zamówień w sklepie CraftRoni",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Oczekuje na płatność", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Opłacone", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "W realizacji", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Wysłane", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Dostarczone", color: "bg-background text-foreground" },
  CANCELLED: { label: "Anulowane", color: "bg-primary/10 text-primary-dark" },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/konto/logowanie");
  }
  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  if (!user) {
    redirect("/konto/logowanie");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Moje konto</h1>
          <p className="text-muted mt-1">Witaj{user.name ? `, ${user.name}` : ""}!</p>
        </div>
        <AccountLogoutButton />
      </div>

      {/* Dane konta */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <User className="h-5 w-5 text-primary" />
          Dane konta
        </h2>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Imię i nazwisko</dt>
            <dd className="text-foreground font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Konto od</dt>
            <dd className="text-foreground font-medium">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Historia zamówień */}
      <div className="bg-surface rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Historia zamówień
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="h-12 w-12 text-muted/40 mx-auto mb-4" />
            <p className="text-muted mb-6">
              Nie masz jeszcze zamówień na tym koncie.
            </p>
            <Link href="/sklep">
              <Button>Przejdź do sklepu</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-sm text-foreground">
                      {order.orderNumber}
                    </span>
                    <span className="text-sm text-muted ml-3">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        statusLabels[order.status]?.color ?? ""
                      }`}
                    >
                      {statusLabels[order.status]?.label ?? order.status}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </div>
                <ul className="text-sm text-muted space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} × {item.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
