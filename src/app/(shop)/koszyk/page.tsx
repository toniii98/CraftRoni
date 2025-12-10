import { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Koszyk",
  description: "Twój koszyk zakupowy",
};

// Tymczasowe dane - później ze stanu aplikacji
const cartItems = [
  {
    id: "1",
    name: "Kolczyki z bursztynem",
    price: 89,
    quantity: 1,
    image: "/images/products/kolczyki.jpg",
  },
  {
    id: "2",
    name: "Ceramiczny kubek",
    price: 65,
    quantity: 2,
    image: "/images/products/kubek.jpg",
  },
];

export default function CartPage() {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= 200 ? 0 : 15;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Twój koszyk jest pusty
          </h1>
          <p className="text-gray-600 mb-8">
            Dodaj produkty do koszyka, aby kontynuować zakupy
          </p>
          <Link href="/sklep">
            <Button>Przejdź do sklepu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Koszyk</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-6 p-6 ${
                  index !== cartItems.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                {/* Image placeholder */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs">[Zdjęcie]</span>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-red-600 font-semibold">{item.price} zł</p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right w-24">
                  <p className="font-semibold text-gray-900">
                    {item.price * item.quantity} zł
                  </p>
                </div>

                {/* Remove */}
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Continue shopping */}
          <div className="mt-6">
            <Link
              href="/sklep"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              ← Kontynuuj zakupy
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Podsumowanie
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Produkty</span>
                <span className="font-medium">{subtotal} zł</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dostawa</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">Darmowa!</span>
                  ) : (
                    `${shipping} zł`
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-sm text-gray-500">
                  Darmowa dostawa od 200 zł (brakuje{" "}
                  <span className="text-red-600 font-medium">
                    {200 - subtotal} zł
                  </span>
                  )
                </p>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Razem</span>
                <span className="font-bold text-red-600">{total} zł</span>
              </div>
            </div>

            <Link href="/zamowienie">
              <Button className="w-full" size="lg">
                Przejdź do płatności
              </Button>
            </Link>

            <p className="text-xs text-gray-500 text-center mt-4">
              Bezpieczne płatności obsługiwane przez Przelewy24
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
