import Link from "next/link";
import { ArrowRight, Truck, Shield, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { siteConfig } from "@/lib/config";

// Tymczasowe dane - później pobierane z bazy
const featuredCategories = [
  {
    name: "Biżuteria",
    slug: "bizuteria",
    image: "/images/categories/bizuteria.jpg",
    description: "Ręcznie robiona biżuteria",
  },
  {
    name: "Ceramika",
    slug: "ceramika",
    image: "/images/categories/ceramika.jpg",
    description: "Unikalna ceramika artystyczna",
  },
  {
    name: "Tekstylia",
    slug: "tekstylia",
    image: "/images/categories/tekstylia.jpg",
    description: "Ręcznie szyte i tkane",
  },
  {
    name: "Dekoracje",
    slug: "dekoracje",
    image: "/images/categories/dekoracje.jpg",
    description: "Ozdoby do domu",
  },
];

const features = [
  {
    icon: Heart,
    title: "Polskie Rękodzieło",
    description: "Wspieramy lokalnych twórców i polską tradycję rzemieślniczą",
  },
  {
    icon: Sparkles,
    title: "Unikalne Produkty",
    description: "Każdy przedmiot jest jedyny w swoim rodzaju",
  },
  {
    icon: Truck,
    title: "Szybka Dostawa",
    description: `Darmowa dostawa od ${siteConfig.shop.freeShippingThreshold} zł`,
  },
  {
    icon: Shield,
    title: "Bezpieczne Zakupy",
    description: "Gwarancja zwrotu i bezpieczne płatności",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-red-100 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Odkryj piękno{" "}
                <span className="text-red-600">polskiego rękodzieła</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-lg">
                Unikalne, ręcznie robione produkty od polskich twórców. 
                Biżuteria, ceramika, tekstylia i wiele więcej.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sklep">
                  <Button size="lg" className="w-full sm:w-auto">
                    Przeglądaj sklep
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/o-nas">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Poznaj nas
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Hero image placeholder */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-red-200 to-red-300 rounded-2xl flex items-center justify-center">
                <span className="text-red-600 text-lg font-medium">
                  [Hero Image]
                </span>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-600 rounded-full opacity-20" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-red-400 rounded-full opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-full mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Przeglądaj kategorie
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Odkryj różnorodność polskiego rękodzieła - od biżuterii po ceramikę
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/kategorie/${category.slug}`}
                className="group"
              >
                <div className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden mb-4">
                  {/* Placeholder for category image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      [Zdjęcie]
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg group-hover:text-red-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Wyróżnione produkty
              </h2>
              <p className="text-gray-600">
                Najpiękniejsze dzieła naszych twórców
              </p>
            </div>
            <Link href="/sklep">
              <Button variant="outline">
                Zobacz wszystkie
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Product grid placeholder */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">
                    [Produkt {i}]
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  Nazwa produktu
                </h3>
                <p className="text-red-600 font-semibold">
                  99,00 zł
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Śledź nas na Instagramie
            </h2>
            <p className="text-gray-600 mb-4">
              @craftroni - Bądź na bieżąco z nowościami
            </p>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
            >
              Obserwuj nas
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
          
          {/* Instagram widget placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">
                  [IG Post {i}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Dołącz do miłośników rękodzieła
          </h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Zapisz się do newslettera i otrzymaj 10% rabatu na pierwsze zakupy!
          </p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Twój adres email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button variant="secondary" size="lg">
              Zapisz się
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
