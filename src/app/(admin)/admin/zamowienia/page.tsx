import { Metadata } from "next";
import Link from "next/link";
import { Package, Eye, Truck, CheckCircle, Clock, XCircle, CreditCard, ShoppingBag } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Zamówienia | Admin",
  description: "Zarządzanie zamówieniami",
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: "Oczekujące", className: "bg-yellow-100 text-yellow-800", icon: Clock },
    PAID: { label: "Opłacone", className: "bg-blue-100 text-blue-800", icon: CreditCard },
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

const formatDate = (date: Date) => {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price: number) => {
  return price.toFixed(2).replace(".", ",") + " zł";
};

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search } },
      { customerName: { contains: params.search } },
      { customerEmail: { contains: params.search } },
    ];
  }

  // Fetch orders and stats
  const [orders, totalCount, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Process stats
  const statusCounts: Record<string, number> = {
    PENDING: 0,
    PAID: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  stats.forEach((stat) => {
    statusCounts[stat.status] = stat._count.id;
  });

  // Helper to build URL
  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();
    const merged = { ...params, ...newParams };
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        urlParams.set(key, value);
      }
    });
    const queryString = urlParams.toString();
    return `/admin/zamowienia${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zamówienia</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj zamówieniami klientów ({totalCount} zamówień)
          </p>
        </div>
        
        {/* Filters */}
        <form className="flex gap-2">
          <select 
            name="status"
            defaultValue={params.status || "all"}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="PENDING">Oczekujące</option>
            <option value="PAID">Opłacone</option>
            <option value="PROCESSING">W realizacji</option>
            <option value="SHIPPED">Wysłane</option>
            <option value="DELIVERED">Dostarczone</option>
            <option value="CANCELLED">Anulowane</option>
          </select>
          <input
            type="text"
            name="search"
            defaultValue={params.search || ""}
            placeholder="Szukaj zamówień..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Filtruj
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Link 
          href={buildUrl({ status: "PENDING", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "PENDING" ? "ring-2 ring-yellow-500" : ""} bg-yellow-50 hover:bg-yellow-100`}
        >
          <p className="text-yellow-600 text-sm font-medium">Oczekujące</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{statusCounts.PENDING}</p>
        </Link>
        <Link 
          href={buildUrl({ status: "PAID", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "PAID" ? "ring-2 ring-blue-500" : ""} bg-blue-50 hover:bg-blue-100`}
        >
          <p className="text-blue-600 text-sm font-medium">Opłacone</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.PAID}</p>
        </Link>
        <Link 
          href={buildUrl({ status: "PROCESSING", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "PROCESSING" ? "ring-2 ring-purple-500" : ""} bg-purple-50 hover:bg-purple-100`}
        >
          <p className="text-purple-600 text-sm font-medium">W realizacji</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{statusCounts.PROCESSING}</p>
        </Link>
        <Link 
          href={buildUrl({ status: "SHIPPED", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "SHIPPED" ? "ring-2 ring-indigo-500" : ""} bg-indigo-50 hover:bg-indigo-100`}
        >
          <p className="text-indigo-600 text-sm font-medium">Wysłane</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{statusCounts.SHIPPED}</p>
        </Link>
        <Link 
          href={buildUrl({ status: "DELIVERED", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "DELIVERED" ? "ring-2 ring-green-500" : ""} bg-green-50 hover:bg-green-100`}
        >
          <p className="text-green-600 text-sm font-medium">Dostarczone</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{statusCounts.DELIVERED}</p>
        </Link>
        <Link 
          href={buildUrl({ status: "CANCELLED", page: undefined })}
          className={`rounded-lg p-4 transition-colors ${params.status === "CANCELLED" ? "ring-2 ring-red-500" : ""} bg-red-50 hover:bg-red-100`}
        >
          <p className="text-red-600 text-sm font-medium">Anulowane</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{statusCounts.CANCELLED}</p>
        </Link>
      </div>

      {/* Clear filters */}
      {(params.status || params.search) && (
        <div className="mb-4">
          <Link
            href="/admin/zamowienia"
            className="text-sm text-red-600 hover:text-red-700"
          >
            ← Wyczyść filtry
          </Link>
        </div>
      )}

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zamówień</h3>
            <p className="text-gray-500">
              {params.status || params.search
                ? "Nie znaleziono zamówień spełniających kryteria."
                : "Nie masz jeszcze żadnych zamówień."}
            </p>
          </div>
        ) : (
          <>
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
                        {order._count.items} szt.
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatPrice(Number(order.total))}
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
                Wyświetlono {offset + 1}-{Math.min(offset + limit, totalCount)} z {totalCount} zamówień
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Poprzednia
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Następna
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
