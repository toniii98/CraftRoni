"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ClaimOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/account/orders/${orderId}/claim`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się przypisać zamówienia");
        return;
      }

      setMessage("Zamówienie zostało przypisane do Twojego konta.");
      router.refresh();
    } catch {
      setError("Nie udało się przypisać zamówienia.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" onClick={handleClaim} isLoading={isLoading}>
        Przypisz do mojego konta
      </Button>
      {message && <p className="text-xs text-green-700">{message}</p>}
      {error && <p className="text-xs text-primary">{error}</p>}
    </div>
  );
}
