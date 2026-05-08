"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/konto";
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła muszą być identyczne.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się utworzyć konta");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Nie udało się utworzyć konta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Załóż konto klienta</h1>
          <p className="mt-2 text-sm text-muted">Zapisz adresy, śledź zamówienia i odzyskaj zakupy gościnne.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Imię i nazwisko"
            value={formData.fullName}
            onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              label="Telefon"
              type="tel"
              value={formData.phone}
              onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Hasło"
              type="password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            />
            <Input
              label="Powtórz hasło"
              type="password"
              value={formData.confirmPassword}
              onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Utwórz konto
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Masz już konto?{' '}
          <Link href={`/konto/logowanie?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-primary hover:text-primary-dark">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
