"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button, Input } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface FormData {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Wyczyść błąd przy edycji
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "Email jest wymagany";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Nieprawidłowy adres email";
    }

    if (!formData.name) {
      newErrors.name = "Imię i nazwisko jest wymagane";
    }

    if (!formData.address) {
      newErrors.address = "Adres jest wymagany";
    }

    if (!formData.city) {
      newErrors.city = "Miasto jest wymagane";
    }

    if (!formData.zipCode) {
      newErrors.zipCode = "Kod pocztowy jest wymagany";
    } else if (!/^\d{2}-\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = "Nieprawidłowy format (XX-XXX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          shippingCity: formData.city,
          shippingZip: formData.zipCode,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        router.push(data.data.paymentUrl);
      } else {
        alert(data.error || "Wystąpił błąd podczas składania zamówienia");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Twój koszyk jest pusty
          </h1>
          <p className="text-gray-600 mb-8">
            Dodaj produkty do koszyka, aby kontynuować
          </p>
          <Link href="/sklep">
            <Button>Przejdź do sklepu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/koszyk"
        className="inline-flex items-center text-gray-600 hover:text-red-600 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Wróć do koszyka
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Zamówienie</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Dane kontaktowe
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="email"
                    label="Email *"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="jan@example.com"
                  />
                </div>
                <Input
                  label="Imię i nazwisko *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Jan Kowalski"
                />
                <Input
                  type="tel"
                  label="Telefon (opcjonalnie)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Adres dostawy
              </h2>
              <div className="space-y-4">
                <Input
                  label="Ulica i numer *"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="ul. Przykładowa 123/4"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Miasto *"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    placeholder="Warszawa"
                  />
                  <Input
                    label="Kod pocztowy *"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={errors.zipCode}
                    placeholder="00-000"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Uwagi do zamówienia
              </h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Dodatkowe informacje..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Podsumowanie
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">[IMG]</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatPrice(item.product.salePrice || item.product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-gray-200 mb-4" />

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produkty</span>
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
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Razem</span>
                  <span className="font-bold text-red-600">
                    {formatPrice(cart.total)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                Przejdź do płatności
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Płatności obsługiwane przez Przelewy24.
                <br />
                Akceptujemy BLIK, karty i przelewy.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
