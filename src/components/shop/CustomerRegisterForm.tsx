"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, MailCheck, UserPlus } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function CustomerRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd rejestracji");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center sm:p-8">
        <MailCheck className="mx-auto h-10 w-10 text-green-700" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Sprawdź swoją pocztę</h2>
        <p className="mt-2 text-muted">
          Jeśli adres może zostać użyty, wysłaliśmy link aktywacyjny ważny przez 24 godziny.
        </p>
        <Link
          href="/konto/logowanie"
          className="mt-5 inline-block text-primary underline underline-offset-4"
        >
          Przejdź do logowania
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
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="twoj@email.pl"
        />
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <UserPlus className="h-4 w-4 mr-2" />
          {isLoading ? "Tworzenie konta..." : "Załóż konto"}
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Masz już konto?{" "}
        <Link href="/konto/logowanie" className="text-primary underline underline-offset-4">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
