"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, MailCheck } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function EmailVerificationForm() {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function verify() {
    if (!termsAccepted) {
      setError("Akceptacja regulaminu jest wymagana");
      return;
    }
    if (password !== repeatPassword) {
      setError("Hasła nie są identyczne");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, termsAccepted }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się potwierdzić adresu e-mail");
      setVerified(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się potwierdzić adresu e-mail");
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Adres e-mail potwierdzony</h1>
        <p className="mt-2 text-muted">Możesz teraz bezpiecznie zalogować się na konto.</p>
        <Link href="/konto/logowanie" className="mt-6 inline-block">
          <Button>Przejdź do logowania</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center sm:p-8">
      <MailCheck className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">Potwierdź adres e-mail</h1>
      <p className="mt-2 text-muted">
        Ustaw hasło, aby aktywować konto. Link działa przez 24 godziny; po otwarciu
        dokończ tę czynność w ciągu 30 minut albo otwórz link ponownie.
      </p>
      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-left text-sm text-primary">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="mt-6 space-y-4 text-left">
        <Input
          label="Imię i nazwisko"
          autoComplete="name"
          minLength={2}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jan Kowalski"
        />
        <Input
          label="Nowe hasło (min. 8 znaków)"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          label="Powtórz hasło"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={repeatPassword}
          onChange={(event) => setRepeatPassword(event.target.value)}
        />
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-muted">
            Akceptuję{" "}
            <Link href="/regulamin" target="_blank" className="text-primary underline underline-offset-4">
              regulamin sklepu
            </Link>{" "}
            i zapoznałem się z{" "}
            <Link href="/prywatnosc" target="_blank" className="text-primary underline underline-offset-4">
              polityką prywatności
            </Link>
            .
          </span>
        </label>
      </div>
      <Button
        className="mt-6"
        onClick={verify}
        disabled={
          loading ||
          name.trim().length < 2 ||
          password.length < 8 ||
          repeatPassword.length < 8 ||
          !termsAccepted
        }
      >
        {loading ? "Potwierdzanie..." : "Potwierdź mój adres e-mail"}
      </Button>
    </div>
  );
}
