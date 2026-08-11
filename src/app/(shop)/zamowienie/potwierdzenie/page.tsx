import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Clock, Package, Mail } from "lucide-react";
import prisma from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { isAutopayConfigured, verifyAutopayReturn } from "@/lib/autopay";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Potwierdzenie zamówienia",
};

// Status płatności zmienia się po komunikacie ITN Autopay — strona nie może być statyczna.
export const dynamic = "force-dynamic";

interface ConfirmationPageProps {
  searchParams: Promise<{
    order?: string;
    ServiceID?: string;
    OrderID?: string;
    Hash?: string;
  }>;
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  // Własny link używa `order`. Powrót z Autopay jest podpisany i używa nazw
  // parametrów z wielką literą. Nie ufamy OrderID bez poprawnego hasha.
  const isValidAutopayReturn =
    isAutopayConfigured() &&
    verifyAutopayReturn({
      serviceId: params.ServiceID,
      orderId: params.OrderID,
      hash: params.Hash,
    });
  const orderNumber = isValidAutopayReturn ? params.OrderID : params.order;

  // Pokazujemy wyłącznie status — dane osobowe zamówienia nie są tu dostępne
  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        select: { status: true, paidAt: true },
      })
    : null;

  const isPaid = order?.status === "PAID" || Boolean(order?.paidAt);
  const emailEnabled = isEmailConfigured();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isPaid ? "bg-green-100" : "bg-background border border-border"
          }`}
        >
          {isPaid ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : (
            <Clock className="h-10 w-10 text-primary" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          Dziękujemy za zamówienie!
        </h1>

        <p className="text-muted mb-2">
          {isPaid
            ? "Płatność została potwierdzona — zamówienie trafiło do realizacji."
            : "Zamówienie zostało przyjęte i oczekuje na potwierdzenie płatności."}
        </p>

        {orderNumber && (
          <p className="text-lg font-medium text-foreground mb-8">
            Numer zamówienia:{" "}
            <span className="font-mono text-primary">{orderNumber}</span>
          </p>
        )}

        {!isPaid && (
          <p className="text-sm text-muted mb-8">
            Jeśli płatność została właśnie wykonana, potwierdzenie może potrwać
            do kilku minut — odśwież stronę lub sprawdź skrzynkę e-mail.
          </p>
        )}

        <div className="bg-background rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-foreground mb-4">Co dalej?</h2>
          <ul className="space-y-4">
            {emailEnabled && (
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Potwierdzenie email</p>
                  <p className="text-sm text-muted">
                    Wysłaliśmy potwierdzenie na Twój adres email
                  </p>
                </div>
              </li>
            )}
            <li className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Realizacja zamówienia</p>
                <p className="text-sm text-muted">
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
