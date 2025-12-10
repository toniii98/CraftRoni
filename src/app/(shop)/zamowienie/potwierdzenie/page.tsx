import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Package, Mail } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Potwierdzenie zamówienia",
};

interface ConfirmationPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order || "BRAK";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dziękujemy za zamówienie!
        </h1>

        <p className="text-gray-600 mb-2">
          Twoje zamówienie zostało przyjęte do realizacji.
        </p>

        <p className="text-lg font-medium text-gray-900 mb-8">
          Numer zamówienia:{" "}
          <span className="font-mono text-red-600">{orderNumber}</span>
        </p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">Co dalej?</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Potwierdzenie email</p>
                <p className="text-sm text-gray-600">
                  Wysłaliśmy potwierdzenie na Twój adres email
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Package className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Realizacja zamówienia</p>
                <p className="text-sm text-gray-600">
                  Przygotujemy Twoje zamówienie w ciągu 1-3 dni roboczych
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sklep">
            <Button variant="outline">Kontynuuj zakupy</Button>
          </Link>
          <Link href="/">
            <Button>Strona główna</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
