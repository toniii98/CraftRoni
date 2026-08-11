"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Błąd aplikacji:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-background">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
        <AlertTriangle className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">
        Coś poszło nie tak
      </h1>
      <p className="text-muted mb-8 max-w-md">
        Wystąpił nieoczekiwany błąd. Spróbuj ponownie — jeśli problem się
        powtarza, skontaktuj się z nami.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
