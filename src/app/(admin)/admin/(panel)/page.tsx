import { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, Clock, TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  description: "Panel administracyjny CraftRoni",
};

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Oczekuje", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Opłacone", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Realizacja", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Wysłane", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Dostarczone", color: "bg-background text-foreground" },
  CANCELLED: { label: "Anulowane", color: "bg-primary/10 text-primary-dark" },
};

export default async function AdminDashboard() {
  const [productCount, orderCount, pendingCount, revenueAgg, recentOrders] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
        },
      }),
    ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);

  const stats = [
    { name: "Aktywne produkty", value: String(productCount), icon: Package },
    { name: "Wszystkie zamówienia", value: String(orderCount), icon: ShoppingCart },
    { name: "Do obsłużenia", value: String(pendingCount), icon: Clock },
    { name: "Przychód (opłacone)", value: formatPrice(revenue), icon: TrendingUp },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted">Witaj w panelu administracyjnym CraftRoni</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-surface rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-surface rounded-xl shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Ostatnie zamówienia
          </h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted">
            Brak zamówień — pojawią się tu, gdy klienci zaczną kupować.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Nr zamówienia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-background">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusLabels[order.status]?.color
                        }`}
                      >
                        {statusLabels[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/zamowienia/${order.id}`}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-border">
          <Link
            href="/admin/zamowienia"
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            Zobacz wszystkie zamówienia →
          </Link>
        </div>
      </div>
    </div>
  );
}
