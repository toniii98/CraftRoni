import { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, Package, Mail, XCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { isAutopayConfigured, verifyAutopayReturn } from "@/lib/autopay";
import {
  isValidPaymentAccessToken,
  PAYMENT_ACCESS_COOKIE,
  paymentValidityTime,
  verifyPaymentAccessToken,
} from "@/lib/order-security";
import { isCheckoutEnabled } from "@/lib/runtime-env";
import { Button } from "@/components/ui";
import { CheckoutAttemptCleaner } from "@/components/shop/CheckoutAttemptCleaner";

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
  const paymentToken = (await cookies()).get(PAYMENT_ACCESS_COOKIE)?.value;
  // Własny link używa `order`. Powrót z Autopay jest podpisany i używa nazw
  // parametrów z wielką literą. Nie ufamy OrderID bez poprawnego hasha.
  const isValidAutopayReturn =
    isAutopayConfigured() &&
    verifyAutopayReturn({
      serviceId: params.ServiceID,
      orderId: params.OrderID,
      hash: params.Hash,
    });
  const hasValidOwnLink = Boolean(params.order && isValidPaymentAccessToken(paymentToken));
  const orderNumber = isValidAutopayReturn
    ? params.OrderID
    : hasValidOwnLink
      ? params.order
      : undefined;

  // Pokazujemy wyłącznie status — dane osobowe zamówienia nie są tu dostępne
  const candidateOrder = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        select: {
          status: true,
          paidAt: true,
          paymentReviewRequired: true,
          reservationExpiresAt: true,
          stockReleasedAt: true,
          checkoutKeyHash: true,
        },
      })
    : null;
  const hasPaymentAccess = Boolean(
    candidateOrder &&
      candidateOrder.reservationExpiresAt &&
      candidateOrder.reservationExpiresAt > new Date() &&
      verifyPaymentAccessToken(paymentToken, candidateOrder.checkoutKeyHash)
  );
  const order = isValidAutopayReturn || hasPaymentAccess ? candidateOrder : null;

  const requiresReview = Boolean(order?.paymentReviewRequired);
  const isCancelled = Boolean(order?.status === "CANCELLED" && !requiresReview);
  const isPaid = Boolean(
    order &&
      !requiresReview &&
      order.status !== "CANCELLED" &&
      (order.paidAt || ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
  );
  const isPending = Boolean(order && !isPaid && !requiresReview && !isCancelled);
  const canResumePayment = Boolean(
    order &&
      hasPaymentAccess &&
      isPending &&
      !order.stockReleasedAt &&
      order.reservationExpiresAt &&
      paymentValidityTime(order.reservationExpiresAt) > new Date() &&
      isCheckoutEnabled() &&
      isAutopayConfigured()
  );
  const emailEnabled = isEmailConfigured();

  const heading = !order
    ? "Nie udało się potwierdzić zamówienia"
    : requiresReview
      ? "Płatność wymaga sprawdzenia"
      : isCancelled
        ? "Rezerwacja nie jest już aktywna"
        : "Dziękujemy za zamówienie!";
  const message = !order
    ? "Link jest nieprawidłowy albo nie prowadzi do dostępnego zamówienia."
    : requiresReview
      ? "Nie wykonuj kolejnej płatności. Transakcja została zapisana i wymaga ręcznego uzgodnienia; skontaktujemy się po jej sprawdzeniu."
      : isCancelled
        ? "Zamówienie zostało anulowane albo jego rezerwacja wygasła. Produkty nie są już dla niego zarezerwowane."
        : isPaid
          ? "Płatność została potwierdzona — zamówienie trafiło do realizacji."
          : "Zamówienie zostało przyjęte i oczekuje na potwierdzenie płatności.";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {order && orderNumber && <CheckoutAttemptCleaner orderNumber={orderNumber} />}
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isPaid
              ? "bg-green-100"
              : requiresReview
                ? "bg-yellow-100"
                : isCancelled || !order
                  ? "bg-primary/10"
                  : "bg-background border border-border"
          }`}
        >
          {isPaid ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : requiresReview ? (
            <AlertTriangle className="h-10 w-10 text-yellow-700" />
          ) : isCancelled || !order ? (
            <XCircle className="h-10 w-10 text-primary" />
          ) : (
            <Clock className="h-10 w-10 text-primary" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          {heading}
        </h1>

        <p className="text-muted mb-2">{message}</p>

        {order && orderNumber && (
          <p className="text-lg font-medium text-foreground mb-8">
            Numer zamówienia:{" "}
            <span className="font-mono text-primary">{orderNumber}</span>
          </p>
        )}

        {isPending && (
          <p className="text-sm text-muted mb-8">
            Jeśli płatność została właśnie wykonana, potwierdzenie może potrwać
            do kilku minut — odśwież stronę lub sprawdź skrzynkę e-mail.
          </p>
        )}

        {order && !requiresReview && !isCancelled && (
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
            {isPaid && (
              <li className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Realizacja zamówienia</p>
                  <p className="text-sm text-muted">
                    Przygotujemy Twoje zamówienie w ciągu 1-3 dni roboczych
                  </p>
                </div>
              </li>
            )}
          </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {canResumePayment && orderNumber && (
            <Link href={`/platnosc/autopay?${new URLSearchParams({ order: orderNumber })}`}>
              <Button>Dokończ płatność</Button>
            </Link>
          )}
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
