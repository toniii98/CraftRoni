"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Send } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się wysłać linku");
        return;
      }

      setSentMessage(data.message);
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sentMessage) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-foreground mb-2">{sentMessage}</p>
        <p className="text-sm text-muted mb-6">
          Sprawdź skrzynkę (także folder ze spamem). Link jest ważny przez godzinę.
        </p>
        <Link href="/konto/logowanie">
          <Button variant="outline">Wróć do logowania</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary">{error}</p>
          </div>
        )}

        <Input
          label="Adres email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.pl"
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Wysyłanie..." : "Wyślij link do resetu"}
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Pamiętasz hasło?{" "}
        <Link href="/konto/logowanie" className="text-primary underline underline-offset-4">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
