"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [form, setForm] = useState({ password: "", repeatPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.repeatPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się ustawić nowego hasła");
        return;
      }

      setIsDone(true);
      setTimeout(() => router.push("/konto/logowanie"), 2500);
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-foreground mb-2">Hasło zostało zmienione.</p>
        <p className="text-sm text-muted mb-6">
          Za chwilę przeniesiemy Cię do logowania.
        </p>
        <Link href="/konto/logowanie">
          <Button>Zaloguj się</Button>
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
          label="Nowe hasło (min. 8 znaków)"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="••••••••"
        />
        <Input
          label="Powtórz nowe hasło"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.repeatPassword}
          onChange={(e) => setForm((prev) => ({ ...prev, repeatPassword: e.target.value }))}
          placeholder="••••••••"
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <KeyRound className="h-4 w-4 mr-2" />
          {isLoading ? "Zapisywanie..." : "Ustaw nowe hasło"}
        </Button>
      </form>
    </div>
  );
}
