import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { isPasswordResetTokenValid } from "@/lib/auth";
import { Button } from "@/components/ui";
import { PasswordResetConfirmForm } from "@/components/shop/PasswordResetConfirmForm";

export const metadata: Metadata = {
  title: "Ustaw nowe hasło",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PasswordResetConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const isValid = await isPasswordResetTokenValid(token);

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">
        Ustaw nowe hasło
      </h1>

      {isValid ? (
        <>
          <p className="text-muted text-center mb-8">
            Wpisz nowe hasło do swojego konta
          </p>
          <PasswordResetConfirmForm token={token} />
        </>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-6 sm:p-8 text-center mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-foreground mb-2">Link jest nieprawidłowy lub wygasł</p>
          <p className="text-sm text-muted mb-6">
            Linki do resetu hasła są ważne przez godzinę i można ich użyć tylko raz.
          </p>
          <Link href="/konto/reset-hasla">
            <Button>Poproś o nowy link</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
