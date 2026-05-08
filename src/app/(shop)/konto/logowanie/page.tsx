"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/konto";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się zalogować");
        return;
      }

      router.push(data.user?.role === "ADMIN" && redirectTo === "/konto" ? "/admin" : redirectTo);
      router.refresh();
    } catch {
      setError("Nie udało się zalogować.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Zaloguj się do konta</h1>
          <p className="mt-2 text-sm text-muted">Śledź zamówienia i korzystaj z szybszego checkoutu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="jan@example.com"
          />
          <Input
            label="Hasło"
            type="password"
            value={formData.password}
            onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="••••••••"
          />
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Zaloguj się
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-muted">
          <p>
            Nie masz konta?{' '}
            <Link href={`/konto/rejestracja?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-primary hover:text-primary-dark">
              Załóż konto
            </Link>
          </p>
          <p className="flex items-center justify-center gap-1">
            <Mail className="h-4 w-4" />
            Logowanie działa także dla zakupów gościnnych dopasowanych po emailu.
          </p>
          <p className="flex items-center justify-center gap-1">
            <Lock className="h-4 w-4" />
            Dane testowe klienta: anna@craftroni.pl / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
