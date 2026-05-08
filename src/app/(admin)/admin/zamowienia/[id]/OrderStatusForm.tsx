"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2 } from "lucide-react";

const statuses = [
  { value: "PENDING", label: "Oczekujące" },
  { value: "PAID", label: "Opłacone" },
  { value: "PROCESSING", label: "W realizacji" },
  { value: "SHIPPED", label: "Wysłane" },
  { value: "DELIVERED", label: "Dostarczone" },
  { value: "CANCELLED", label: "Anulowane" },
];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  canLinkMatchedUser: boolean;
}

export function OrderStatusForm({ orderId, currentStatus, canLinkMatchedUser }: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Wystąpił błąd");
      }

      setMessage({ type: "success", text: "Status został zaktualizowany" });
      setNotes("");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Wystąpił błąd",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkMatchedUser = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimMatchedUser: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Wystąpił błąd");
      }

      setMessage({ type: "success", text: "Zamówienie zostało przypisane do dopasowanego konta." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Wystąpił błąd",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
          Nowy status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
          Dodaj notatkę (opcjonalnie)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="np. Numer przesyłki..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-primary/5 text-primary-dark"
          }`}
        >
          {message.text}
        </div>
      )}

      {canLinkMatchedUser && (
        <button
          type="button"
          onClick={handleLinkMatchedUser}
          disabled={loading}
          className="w-full px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          Przypisz do dopasowanego klienta
        </button>
      )}

      <button
        type="submit"
        disabled={loading || status === currentStatus}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Aktualizuję...
          </>
        ) : (
          "Aktualizuj status"
        )}
      </button>
    </form>
  );
}
