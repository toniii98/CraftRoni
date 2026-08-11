import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Instagram } from "lucide-react";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui";
import { ProductGrid } from "@/components/shop";
import { siteConfig } from "@/lib/config";

// Treść zależy od bazy (produkty, kategorie, ustawienia)
export const dynamic = "force-dynamic";

const categoryEmojis: Record<string, string> = {
  portfeliki: "👛",
  nerki: "👝",
  "giga-nerki": "🎒",
};

export default async function HomePage() {
  const [categories, rawFeatured] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const featuredProducts = rawFeatured.map((product) => ({
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  }));

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-background py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Cześć! Tu <span className="text-primary">weRONIka</span> i mój mały
                rękodzielniczy sklep.
              </h1>
              <p className="text-xl text-muted max-w-lg">
                Znajdziesz tu unikatowe projekty upcyklingowe, które powstają w
                mojej domowej pracowni i czynią codzienność odrobinę piękniejszą. ✨
              </p>
              <div>
                <Link href="/sklep">
                  <Button size="lg" className="w-full sm:w-auto">
                    Przeglądaj sklep
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Emblemat marki */}
            <div className="relative">
              <div className="aspect-square bg-surface border border-border rounded-2xl flex items-center justify-center shadow-sm p-10">
                <Image
                  src="/brand/emblem.png"
                  alt="craft.roni — polskie rękodzieło"
                  width={480}
                  height={525}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary rounded-full opacity-20 -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-dark rounded-full opacity-15 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Przeglądaj kategorie
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Od kompaktowych portfelików po giga nerki, które zmieszczą wszystko
              </p>
            </div>

            {/* flex-wrap + justify-center — kafelki są wyśrodkowane
                niezależnie od liczby kategorii (także gdy nie wypełniają rzędu) */}
            <div className="flex flex-wrap justify-center gap-6">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/sklep?kategoria=${category.slug}`}
                  className="group w-[calc(50%-0.75rem)] sm:w-60"
                >
                  <div className="relative aspect-square bg-surface border border-border rounded-xl overflow-hidden mb-4">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-50">
                          {categoryEmojis[category.slug] || "📦"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-foreground/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-serif text-white font-semibold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-white/80 text-sm line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Wyróżnione produkty
                </h2>
              </div>
              <Link href="/sklep">
                <Button variant="outline">
                  Zobacz wszystkie
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Instagram Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
            <Instagram className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Śledź nas na Instagramie
          </h2>
          <p className="text-muted mb-4">
            @craft.roni - Bądź na bieżąco z nowościami
          </p>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:text-primary-dark font-medium underline underline-offset-4"
          >
            Obserwuj nas
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </section>

    </>
  );
}
