import { Metadata } from "next";
import Link from "next/link";
import { Package, Eye, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Zamówienia | Admin",
  description: "Zarządzanie zamówieniami",
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: "Oczekujące", className: "bg-yellow-100 text-yellow-800", icon: Clock },
    PAID: { label: "Opłacone", className: "bg-blue-100 text-blue-800", icon: CheckCircle },
    PROCESSING: { label: "W realizacji", className: "bg-purple-100 text-purple-800", icon: Package },
    SHIPPED: { label: "Wysłane", className: "bg-indigo-100 text-indigo-800", icon: Truck },
    DELIVERED: { label: "Dostarczone", className: "bg-green-100 text-green-800", icon: CheckCircle },
    CANCELLED: { label: "Anulowane", className: "bg-red-100 text-red-800", icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// Przykładowe dane - później z API
const orders = [
  {
    id: "1",
    orderNumber: "CR-2024-0001",
    customerName: "Anna Kowalska",
    customerEmail: "anna@example.com",
    total: 254,
    status: "PENDING",
    itemCount: 3,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    orderNumber: "CR-2024-0002",
    customerName: "Jan Nowak",
    customerEmail: "jan@example.com",
    total: 189,
    status: "PAID",
    itemCount: 1,
    createdAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "3",
    orderNumber: "CR-2024-0003",
    customerName: "Maria Wiśniewska",
    customerEmail: "maria@example.com",
    total: 420,
    status: "SHIPPED",
    itemCount: 5,
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    orderNumber: "CR-2024-0004",
    customerName: "Piotr Dąbrowski",
    customerEmail: "piotr@example.com",
    total: 75,
    status: "DELIVERED",
    itemCount: 1,
    createdAt: "2024-01-10T14:20:00Z",
  },
  {
    id: "5",
    orderNumber: "CR-2024-0005",
    customerName: "Ewa Zielińska",
    customerEmail: "ewa@example.com",
    total: 130,
    status: "CANCELLED",
    itemCount: 2,
    createdAt: "2024-01-08T11:00:00Z",
  },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrdersPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zamówienia</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj zamówieniami klientów
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">Wszystkie statusy</option>
            <option value="PENDING">Oczekujące</option>
            <option value="PAID">Opłacone</option>
            <option value="PROCESSING">W realizacji</option>
            <option value="SHIPPED">Wysłane</option>
            <option value="DELIVERED">Dostarczone</option>
            <option value="CANCELLED">Anulowane</option>
          </select>
          <input
            type="text"
            placeholder="Szukaj zamówień..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-600 text-sm font-medium">Oczekujące</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">1</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">Opłacone</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">1</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-indigo-600 text-sm font-medium">Wysłane</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">1</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">Dostarczone</p>
          <p className="text-2xl font-bold text-green-700 mt-1">1</p>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Zamówienie
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Klient
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Produkty
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                  Wartość
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Data
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.itemCount} szt.
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {order.total} zł
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/zamowienia/${order.id}`}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Wyświetlono 1-5 z 5 zamówień
          </p>
          <div className="flex gap-2">
            <button
              disabled
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Poprzednia
            </button>
            <button
              disabled
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Następna
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
