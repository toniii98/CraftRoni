import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createAutopayPaymentForm, isAutopayConfigured } from "@/lib/autopay";
import {
  isValidPaymentAccessToken,
  PAYMENT_ACCESS_COOKIE,
  paymentValidityTime,
  verifyPaymentAccessToken,
} from "@/lib/order-security";
import { isCheckoutEnabled } from "@/lib/runtime-env";
import {
  AutopayRedirectForm,
  AutopayRedirectingMessage,
} from "@/components/shop/AutopayRedirectForm";

export const dynamic = "force-dynamic";

interface AutopayPaymentPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function AutopayPaymentPage({ searchParams }: AutopayPaymentPageProps) {
  const { order: orderNumber } = await searchParams;
  const token = (await cookies()).get(PAYMENT_ACCESS_COOKIE)?.value;

  if (!orderNumber || !isValidPaymentAccessToken(token)) {
    redirect("/koszyk");
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      checkoutKeyHash: true,
      orderNumber: true,
      customerEmail: true,
      total: true,
      status: true,
      paidAt: true,
      paymentMethod: true,
      reservationExpiresAt: true,
      stockReleasedAt: true,
    },
  });

  if (
    !order ||
    !order.reservationExpiresAt ||
    order.reservationExpiresAt <= new Date() ||
    !verifyPaymentAccessToken(token, order.checkoutKeyHash)
  ) {
    redirect("/koszyk");
  }

  const confirmationUrl = `/zamowienie/potwierdzenie?${new URLSearchParams({
    order: order.orderNumber,
  }).toString()}`;
  if (order.paidAt || order.status === "PAID") {
    redirect(confirmationUrl);
  }

  const validityTime = order.reservationExpiresAt
    ? paymentValidityTime(order.reservationExpiresAt)
    : null;
  const canPay =
    isCheckoutEnabled() &&
    isAutopayConfigured() &&
    order.paymentMethod === "autopay" &&
    order.status === "PENDING" &&
    !order.stockReleasedAt &&
    Boolean(validityTime && validityTime > new Date());

  if (!canPay) {
    redirect(confirmationUrl);
  }

  const payment = createAutopayPaymentForm({
    orderNumber: order.orderNumber,
    totalPln: Number(order.total),
    customerEmail: order.customerEmail,
    reservationExpiresAt: validityTime || undefined,
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Bezpieczna płatność</h1>
      <AutopayRedirectingMessage />
      <p className="text-sm text-muted mb-8">
        Jeśli przekierowanie nie nastąpi automatycznie, użyj przycisku poniżej.
      </p>
      <AutopayRedirectForm action={payment.action} fields={payment.fields} />
      <p className="mt-8 text-sm">
        <Link href={confirmationUrl} className="text-primary hover:text-primary-dark">
          Wróć do zamówienia
        </Link>
      </p>
    </div>
  );
}
