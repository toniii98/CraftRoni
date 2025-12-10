import { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui";
import prisma from "@/lib/prisma";
import { DeleteProductButton } from "@/components/admin";

export const metadata: Metadata = {
  title: "Produkty | Admin",
  description: "Zarządzanie produktami",
};

interface SearchParams {
  search?: string;
  category?: string;
  status?: string;
  page?: string;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }
  
  if (params.category && params.category !== "all") {
    where.categoryId = params.category;
  }
  
  if (params.status === "active") {
    where.isActive = true;
  } else if (params.status === "inactive") {
    where.isActive = false;
  }

  // Fetch products and categories
  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { 
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produkty</h1>
          <p className="text-gray-600">Zarządzaj produktami w sklepie ({totalCount} produktów)</p>
        </div>
        <Link href="/admin/produkty/nowy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj produkt
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={params.search || ""}
              placeholder="Szukaj produktów..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select 
            name="category"
            defaultValue={params.category || "all"}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Wszystkie kategorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select 
            name="status"
            defaultValue={params.status || "all"}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Status: Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="inactive">Nieaktywne</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Filtruj
          </button>
        </div>
      </form>

      {/* Products table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak produktów</h3>
            <p className="text-gray-500 mb-4">Nie znaleziono produktów spełniających kryteria.</p>
            <Link href="/admin/produkty/nowy">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwszy produkt
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stan magazynowy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].url} 
                              alt={product.images[0].alt || product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">[IMG]</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.category?.name || "—"}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {product.price.toFixed(2)} zł
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock < 5
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock} szt.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/produkty/${product.id}/edytuj`}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Wyświetlanie {offset + 1}-{Math.min(offset + limit, totalCount)} z {totalCount} produktów
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/produkty?page=${page - 1}${params.search ? `&search=${params.search}` : ""}${params.category ? `&category=${params.category}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Poprzednia
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Link
                      key={pageNum}
                      href={`/admin/produkty?page=${pageNum}${params.search ? `&search=${params.search}` : ""}${params.category ? `&category=${params.category}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                      className={`px-3 py-1 rounded ${
                        page === pageNum
                          ? "bg-red-600 text-white"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link
                    href={`/admin/produkty?page=${page + 1}${params.search ? `&search=${params.search}` : ""}${params.category ? `&category=${params.category}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
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
