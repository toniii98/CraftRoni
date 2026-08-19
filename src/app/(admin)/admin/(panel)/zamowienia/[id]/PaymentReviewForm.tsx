"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentReviewForm({
  orderId,
  reviewCaseId,
  allowNoPaymentFound,
  canAcceptPayment,
  currentStatus,
  currentVersion,
}: {
  orderId: string;
  reviewCaseId: string;
  allowNoPaymentFound: boolean;
  canAcceptPayment: boolean;
  currentStatus: string;
  currentVersion: number;
}) {
  const router = useRouter();
  type Resolution = "PAYMENT_ACCEPTED" | "REFUND_CONFIRMED" | "NO_PAYMENT_FOUND";
  const [resolution, setResolution] = useState<Resolution>(
    allowNoPaymentFound ? "NO_PAYMENT_FOUND" : "REFUND_CONFIRMED"
  );
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const question =
      resolution === "PAYMENT_ACCEPTED"
        ? "Potwierdzasz przyjęcie płatności po sprawdzeniu jej w Autopay? Magazyn może zostać ponownie pomniejszony."
        : resolution === "REFUND_CONFIRMED"
          ? "Potwierdzasz, że zwrot został faktycznie wykonany i wskazana referencja jest poprawna?"
          : "Potwierdzasz, że w historycznym systemie nie ma płatności i stare zamówienie można anulować?";
    if (!window.confirm(question)) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewCaseId,
          resolution,
          reference,
          expectedStatus: currentStatus,
          expectedVersion: currentVersion,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się zapisać rozstrzygnięcia");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się zapisać rozstrzygnięcia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-yellow-300 pt-4">
      <label className="block text-sm font-medium text-yellow-950" htmlFor={`payment-resolution-${reviewCaseId}`}>
        Rozstrzygnięcie po sprawdzeniu we właściwym systemie płatności
      </label>
      <select
        id={`payment-resolution-${reviewCaseId}`}
        value={resolution}
        onChange={(event) =>
          setResolution(event.target.value as Resolution)
        }
        className="w-full rounded-lg border border-yellow-400 bg-white px-3 py-2 text-sm"
      >
        <option value="REFUND_CONFIRMED">Zwrot został potwierdzony</option>
        {canAcceptPayment && (
          <option value="PAYMENT_ACCEPTED">Przyjmij płatność do realizacji</option>
        )}
        {allowNoPaymentFound && (
          <option value="NO_PAYMENT_FOUND">Nie znaleziono płatności — anuluj</option>
        )}
      </select>
      <input
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        minLength={5}
        maxLength={120}
        required
        placeholder="ID zwrotu/transakcji, data kontroli lub numer zgłoszenia"
        className="w-full rounded-lg border border-yellow-400 bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-primary-dark">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Zapisz audytowane rozstrzygnięcie
      </button>
    </form>
  );
}
