import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Grid3X3, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kategorie",
  description: "Przeglądaj portfeliki, nerki i giga nerki szyte przez craft.roni",
};

// Emoji mapping dla kategorii
const categoryEmojis: Record<string, string> = {
  portfeliki: "👛",
  nerki: "👝",
  "giga-nerki": "🎒",
};

const categoryDescriptions: Record<string, string> = {
  portfeliki:
    "Ręcznie szyte portfeliki z tkanin z drugiego obiegu. Posiadają dwie przegródki, mieszczą karty i mają wodoodporną podszewkę.",
  nerki:
    "Ręcznie szyte nerki idealne na co dzień. Wykonane są z tkanin z drugiego obiegu oraz odpadów tapicerskich. Posiadają dwie komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
  "giga-nerki":
    "Ręcznie szyte nerki, które pomieszczą małą butelkę z wodą oraz książkę. Wykonane są z odpadów tapicerskich. Posiadają trzy komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
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
          <div className="p-3 bg-primary/10 rounded-full">
            <Grid3X3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Kategorie produktów
        </h1>
      </div>

      {/* Categories grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/sklep?kategoria=${category.slug}`}
            className="group bg-surface rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 relative overflow-hidden">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
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
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-muted text-sm mt-2">
                    {categoryDescriptions[category.slug] || category.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted">
                  {category._count.products} produktów
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/sklep"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Zobacz wszystkie produkty
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
