import { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";

export const metadata: Metadata = {
  title: "Produkty | Admin",
  description: "Zarządzanie produktami",
};

// Tymczasowe dane
const products = [
  { id: "1", name: "Kolczyki z bursztynem", price: 89, stock: 5, category: "Biżuteria", isActive: true },
  { id: "2", name: "Ceramiczny kubek", price: 65, stock: 12, category: "Ceramika", isActive: true },
  { id: "3", name: "Lniana torba", price: 120, stock: 3, category: "Tekstylia", isActive: true },
  { id: "4", name: "Świeca sojowa", price: 45, stock: 0, category: "Dekoracje", isActive: false },
  { id: "5", name: "Naszyjnik z koralem", price: 150, stock: 2, category: "Biżuteria", isActive: true },
];

export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produkty</h1>
          <p className="text-gray-600">Zarządzaj produktami w sklepie</p>
        </div>
        <Link href="/admin/produkty/nowy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj produkt
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj produktów..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
            <option>Wszystkie kategorie</option>
            <option>Biżuteria</option>
            <option>Ceramika</option>
            <option>Tekstylia</option>
            <option>Dekoracje</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
            <option>Status: Wszystkie</option>
            <option>Aktywne</option>
            <option>Nieaktywne</option>
          </select>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">[IMG]</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{product.category}</td>
                <td className="px-6 py-4 font-medium">{product.price} zł</td>
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
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Wyświetlanie 1-5 z 24 produktów
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Poprzednia
            </button>
            <button className="px-3 py-1 bg-red-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
              Następna
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
