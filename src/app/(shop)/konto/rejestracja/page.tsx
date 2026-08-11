import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CustomerRegisterForm } from "@/components/shop/CustomerRegisterForm";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto w sklepie CraftRoni",
};

export default async function CustomerRegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/konto");
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">
        Rejestracja
      </h1>
      <p className="text-muted text-center mb-8">
        Załóż konto, aby śledzić swoje zamówienia
      </p>
      <CustomerRegisterForm />
    </div>
  );
}
