"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function CustomerLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd logowania");
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
          label="Adres email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="twoj@email.pl"
        />
        <div>
          <Input
            label="Hasło"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
          />
          <div className="text-right mt-1.5">
            <Link
              href="/konto/reset-hasla"
              className="text-sm text-primary underline underline-offset-4"
            >
              Nie pamiętasz hasła?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <LogIn className="h-4 w-4 mr-2" />
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Nie masz konta?{" "}
        <Link href="/konto/rejestracja" className="text-primary underline underline-offset-4">
          Zarejestruj się
        </Link>
      </p>
      <p className="text-xs text-muted text-center mt-2">
        Konto nie jest wymagane — możesz też kupować bez logowania.
      </p>
    </div>
  );
}
