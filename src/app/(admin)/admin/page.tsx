import { Metadata } from "next";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  description: "Panel administracyjny CraftRoni",
};

// Tymczasowe dane statystyk
const stats = [
  { name: "Produkty", value: "24", icon: Package, change: "+3", changeType: "increase" },
  { name: "Zamówienia", value: "12", icon: ShoppingCart, change: "+5", changeType: "increase" },
  { name: "Klienci", value: "156", icon: Users, change: "+12", changeType: "increase" },
  { name: "Przychód", value: "4,520 zł", icon: TrendingUp, change: "+8%", changeType: "increase" },
];

// Tymczasowe ostatnie zamówienia
const recentOrders = [
  { id: "CR-241210-ABC123", customer: "Jan Kowalski", total: 189, status: "PAID" },
  { id: "CR-241210-DEF456", customer: "Anna Nowak", total: 65, status: "PROCESSING" },
  { id: "CR-241209-GHI789", customer: "Piotr Wiśniewski", total: 320, status: "SHIPPED" },
  { id: "CR-241209-JKL012", customer: "Maria Dąbrowska", total: 89, status: "DELIVERED" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Oczekuje", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Opłacone", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Realizacja", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Wysłane", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Dostarczone", color: "bg-background text-foreground" },
  CANCELLED: { label: "Anulowane", color: "bg-primary/10 text-primary-dark" },
};

export default function AdminDashboard() {
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
              <span className="text-sm text-green-600 font-medium">
                {stat.change}
              </span>
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
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">{order.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {order.total} zł
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
                    <button className="text-primary hover:text-primary-dark text-sm font-medium">
                      Szczegóły
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border">
          <a
            href="/admin/zamowienia"
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            Zobacz wszystkie zamówienia →
          </a>
        </div>
      </div>
    </div>
  );
}
