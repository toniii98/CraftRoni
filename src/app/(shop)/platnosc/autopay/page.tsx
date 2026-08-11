import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createAutopayPaymentForm, isAutopayConfigured } from "@/lib/autopay";
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

  if (!orderNumber) {
    redirect("/koszyk");
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      customerEmail: true,
      total: true,
      status: true,
      paidAt: true,
      paymentMethod: true,
    },
  });

  if (!order) {
    redirect("/koszyk");
  }

  const confirmationUrl = `/zamowienie/potwierdzenie?order=${encodeURIComponent(order.orderNumber)}`;
  if (order.paidAt || order.status === "PAID") {
    redirect(confirmationUrl);
  }

  const canPay =
    isAutopayConfigured() &&
    order.paymentMethod === "autopay" &&
    order.status === "PENDING";

  if (!canPay) {
    redirect(confirmationUrl);
  }

  const payment = createAutopayPaymentForm({
    orderNumber: order.orderNumber,
    totalPln: Number(order.total),
    customerEmail: order.customerEmail,
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
