import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Sklep",
  description: "Przeglądaj unikalne, ręcznie robione produkty od polskich twórców",
};

interface SearchParams {
  kategoria?: string;
  sortuj?: string;
  cena?: string;
  strona?: string;
  szukaj?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.strona || "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {
    isActive: true,
  };

  // Filter by category
  if (params.kategoria) {
    const category = await prisma.category.findUnique({
      where: { slug: params.kategoria },
    });
    if (category) {
      where.categoryId = category.id;
    }
  }

  // Filter by price range
  if (params.cena) {
    switch (params.cena) {
      case "0-50":
        where.price = { lte: 50 };
        break;
      case "50-100":
        where.price = { gte: 50, lte: 100 };
        break;
      case "100-200":
        where.price = { gte: 100, lte: 200 };
        break;
      case "200+":
        where.price = { gte: 200 };
        break;
    }
  }

  // Search
  if (params.szukaj) {
    where.OR = [
      { name: { contains: params.szukaj } },
      { description: { contains: params.szukaj } },
    ];
  }

  // Build orderBy
  let orderBy: any = { createdAt: "desc" };
  switch (params.sortuj) {
    case "cena-rosnaco":
      orderBy = { price: "asc" };
      break;
    case "cena-malejaco":
      orderBy = { price: "desc" };
      break;
    case "nazwa":
      orderBy = { name: "asc" };
      break;
    case "najnowsze":
      orderBy = { createdAt: "desc" };
      break;
  }

  // Fetch data
  const [rawProducts, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    }),
  ]);

  // Convert Decimal to number for Product type compatibility
  const products = rawProducts.map((product) => ({
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  // Helper to build URL with params
  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();
    
    // Merge current params with new ones
    const merged = { ...params, ...newParams };
    
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== "") {
        urlParams.set(key, value);
      }
    });
    
    const queryString = urlParams.toString();
    return `/sklep${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sklep</h1>
        <p className="text-gray-600">
          Odkryj unikalne, ręcznie robione produkty od polskich twórców
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Kategorie</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sklep"
                  className={`block py-1 transition-colors ${
                    !params.kategoria
                      ? "text-red-600 font-medium"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  Wszystkie produkty
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={buildUrl({ kategoria: category.slug, strona: undefined })}
                    className={`block py-1 transition-colors ${
                      params.kategoria === category.slug
                        ? "text-red-600 font-medium"
                        : "text-gray-600 hover:text-red-600"
                    }`}
                  >
                    {category.name}
                    <span className="text-gray-400 text-sm ml-1">
                      ({category._count.products})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <hr className="my-6 border-gray-200" />

            <h2 className="font-semibold text-gray-900 mb-4">Cena</h2>
            <ul className="space-y-2">
              {[
                { value: "", label: "Wszystkie ceny" },
                { value: "0-50", label: "Do 50 zł" },
                { value: "50-100", label: "50 - 100 zł" },
                { value: "100-200", label: "100 - 200 zł" },
                { value: "200+", label: "Powyżej 200 zł" },
              ].map((priceRange) => (
                <li key={priceRange.value}>
                  <Link
                    href={buildUrl({ 
                      cena: priceRange.value || undefined, 
                      strona: undefined 
                    })}
                    className={`block py-1 transition-colors ${
                      (params.cena || "") === priceRange.value
                        ? "text-red-600 font-medium"
                        : "text-gray-600 hover:text-red-600"
                    }`}
                  >
                    {priceRange.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Clear filters */}
            {(params.kategoria || params.cena || params.szukaj) && (
              <>
                <hr className="my-6 border-gray-200" />
                <Link
                  href="/sklep"
                  className="block text-center py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Wyczyść filtry
                </Link>
              </>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort & count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <p className="text-gray-600">
              Znaleziono <span className="font-semibold">{totalCount}</span> produktów
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Sortuj:</span>
              <div className="flex gap-1">
                {[
                  { value: "najnowsze", label: "Najnowsze" },
                  { value: "cena-rosnaco", label: "Cena ↑" },
                  { value: "cena-malejaco", label: "Cena ↓" },
                  { value: "nazwa", label: "A-Z" },
                ].map((sort) => (
                  <Link
                    key={sort.value}
                    href={buildUrl({ sortuj: sort.value, strona: undefined })}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      params.sortuj === sort.value
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sort.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Brak produktów
              </h3>
              <p className="text-gray-500 mb-6">
                Nie znaleziono produktów spełniających wybrane kryteria.
              </p>
              <Link
                href="/sklep"
                className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Zobacz wszystkie produkty
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <nav className="flex items-center space-x-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ strona: String(page - 1) })}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Poprzednia
                  </Link>
                )}
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Link
                      key={pageNum}
                      href={buildUrl({ strona: String(pageNum) })}
                      className={`px-4 py-2 rounded-lg ${
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
                    href={buildUrl({ strona: String(page + 1) })}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Następna
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
