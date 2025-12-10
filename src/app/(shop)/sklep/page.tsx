import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sklep",
  description: "Przeglądaj unikalne, ręcznie robione produkty od polskich twórców",
};

// Tymczasowe dane - później z bazy
const products = [
  { id: "1", name: "Kolczyki z bursztynem", price: 89, category: "Biżuteria" },
  { id: "2", name: "Ceramiczny kubek", price: 65, category: "Ceramika" },
  { id: "3", name: "Lniana torba", price: 120, category: "Tekstylia" },
  { id: "4", name: "Świeca sojowa", price: 45, category: "Dekoracje" },
  { id: "5", name: "Naszyjnik z koralem", price: 150, category: "Biżuteria" },
  { id: "6", name: "Wazon ręcznie malowany", price: 180, category: "Ceramika" },
];

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sklep</h1>
        <p className="text-gray-600">
          Odkryj unikalne, ręcznie robione produkty od polskich twórców
        </p>
      </div>

      {/* Filters - placeholder */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Kategorie</h2>
            <ul className="space-y-2">
              <li>
                <button className="text-gray-600 hover:text-red-600 transition-colors">
                  Wszystkie produkty
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-red-600 transition-colors">
                  Biżuteria
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-red-600 transition-colors">
                  Ceramika
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-red-600 transition-colors">
                  Tekstylia
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-red-600 transition-colors">
                  Dekoracje
                </button>
              </li>
            </ul>

            <hr className="my-6 border-gray-200" />

            <h2 className="font-semibold text-gray-900 mb-4">Cena</h2>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-red-600 mr-2" />
                <span className="text-gray-600">Do 50 zł</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-red-600 mr-2" />
                <span className="text-gray-600">50 - 100 zł</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-red-600 mr-2" />
                <span className="text-gray-600">100 - 200 zł</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-red-600 mr-2" />
                <span className="text-gray-600">Powyżej 200 zł</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Znaleziono <span className="font-semibold">{products.length}</span> produktów
            </p>
            <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
              <option>Sortuj: Domyślnie</option>
              <option>Cena: od najniższej</option>
              <option>Cena: od najwyższej</option>
              <option>Nazwa: A-Z</option>
              <option>Najnowsze</option>
            </select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                  <span className="text-gray-400 text-sm">[Zdjęcie]</span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button className="absolute bottom-4 left-4 right-4 bg-white py-2 rounded-lg font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    Dodaj do koszyka
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors mb-1">
                  {product.name}
                </h3>
                <p className="text-red-600 font-semibold">{product.price} zł</p>
              </div>
            ))}
          </div>

          {/* Pagination placeholder */}
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Poprzednia
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Następna
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
