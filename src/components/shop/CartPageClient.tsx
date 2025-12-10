"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartPageClient() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  if (cart.items.length === 0) {
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

  const freeShippingThreshold = 200;
  const amountToFreeShipping = freeShippingThreshold - cart.subtotal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Koszyk</h1>
        <button
          onClick={clearCart}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Wyczyść koszyk
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {cart.items.map((item, index) => (
              <div
                key={item.productId}
                className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-6 ${
                  index !== cart.items.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.images[0].alt || item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">[Zdjęcie]</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/produkt/${item.product.slug}`}
                    className="font-medium text-gray-900 hover:text-red-600 transition-colors block truncate"
                  >
                    {item.product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {item.product.salePrice ? (
                      <>
                        <span className="text-red-600 font-semibold">
                          {formatPrice(item.product.salePrice)}
                        </span>
                        <span className="text-gray-400 text-sm line-through">
                          {formatPrice(item.product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        {formatPrice(item.product.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Zmniejsz ilość"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= (item.product.stock || 99)}
                    className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Zwiększ ilość"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right w-20 sm:w-24 hidden sm:block">
                  <p className="font-semibold text-gray-900">
                    {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Usuń z koszyka"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Continue shopping */}
          <div className="mt-6">
            <Link
              href="/sklep"
              className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
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
                <span className="text-gray-600">Produkty ({cart.items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                <span className="font-medium">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dostawa</span>
                <span className="font-medium">
                  {cart.shippingCost === 0 ? (
                    <span className="text-green-600">Darmowa!</span>
                  ) : (
                    formatPrice(cart.shippingCost)
                  )}
                </span>
              </div>
              {cart.shippingCost > 0 && amountToFreeShipping > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Do darmowej dostawy brakuje{" "}
                    <span className="font-semibold">
                      {formatPrice(amountToFreeShipping)}
                    </span>
                  </p>
                  <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cart.subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Razem</span>
                  <span className="font-bold text-red-600">
                    {formatPrice(cart.total)}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/zamowienie">
              <Button className="w-full" size="lg">
                Przejdź do płatności
              </Button>
            </Link>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Bezpieczne płatności przez Przelewy24
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center text-xs text-gray-500">
                <div>
                  <span className="text-lg">🔒</span>
                  <p>Bezpieczne płatności</p>
                </div>
                <div>
                  <span className="text-lg">🚚</span>
                  <p>Szybka wysyłka</p>
                </div>
                <div>
                  <span className="text-lg">↩️</span>
                  <p>14 dni na zwrot</p>
                </div>
                <div>
                  <span className="text-lg">💬</span>
                  <p>Pomoc online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
