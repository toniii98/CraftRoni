import { Metadata } from "next";
import Link from "next/link";
import { Grid3X3, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kategorie",
  description: "Przeglądaj kategorie produktów rękodzielniczych - biżuteria, ceramika, tekstylia, drewno i więcej",
};

// Emoji mapping dla kategorii
const categoryEmojis: Record<string, string> = {
  "bizuteria": "💎",
  "ceramika": "🏺",
  "tekstylia": "🧶",
  "drewno": "🪵",
  "swiece-aromaty": "🕯️",
  "rekodzielo-ludowe": "🎨",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Grid3X3 className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Kategorie produktów
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Odkryj bogactwo polskiego rękodzieła. Wybierz kategorię i znajdź unikalne produkty tworzone z pasją przez lokalnych artystów.
        </p>
      </div>

      {/* Categories grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/sklep?kategoria=${category.slug}`}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 relative overflow-hidden">
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-50">
                    {categoryEmojis[category.slug] || "📦"}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {category.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {category._count.products} produktów
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Nie możesz się zdecydować?
        </h2>
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          Przeglądaj wszystkie produkty i odkryj coś wyjątkowego dla siebie lub na prezent.
        </p>
        <Link
          href="/sklep"
          className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Zobacz wszystkie produkty
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
