"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function CustomerRegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.repeatPassword) {
      setError("Hasła nie są identyczne");
      return;
    }
    if (!termsAccepted) {
      setError("Akceptacja regulaminu jest wymagana");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          termsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd rejestracji");
        setIsLoading(false);
        return;
      }

      router.push("/konto");
      router.refresh();
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

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
          label="Imię i nazwisko"
          autoComplete="name"
          required
          minLength={2}
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Jan Kowalski"
        />
        <Input
          label="Adres email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="twoj@email.pl"
        />
        <Input
          label="Hasło (min. 8 znaków)"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="••••••••"
        />
        <Input
          label="Powtórz hasło"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={formData.repeatPassword}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, repeatPassword: e.target.value }))
          }
          placeholder="••••••••"
        />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-muted">
            Akceptuję{" "}
            <Link href="/regulamin" target="_blank" className="text-primary underline underline-offset-4">
              regulamin sklepu
            </Link>{" "}
            i{" "}
            <Link href="/prywatnosc" target="_blank" className="text-primary underline underline-offset-4">
              politykę prywatności
            </Link>{" "}
            *
          </span>
        </label>

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
