import { Metadata } from "next";
import { PasswordResetRequestForm } from "@/components/shop/PasswordResetRequestForm";

export const metadata: Metadata = {
  title: "Reset hasła",
  description: "Zresetuj hasło do swojego konta w sklepie CraftRoni",
  robots: { index: false, follow: false },
};

export default function PasswordResetPage() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">
        Nie pamiętasz hasła?
      </h1>
      <p className="text-muted text-center mb-8">
        Podaj adres email — wyślemy link do ustawienia nowego hasła
      </p>
      <PasswordResetRequestForm />
    </div>
  );
}
