import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CustomerLoginForm } from "@/components/shop/CustomerLoginForm";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się na swoje konto w sklepie CraftRoni",
};

export default async function CustomerLoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/konto");
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">
        Logowanie
      </h1>
      <p className="text-muted text-center mb-8">
        Zaloguj się, aby zobaczyć historię zamówień
      </p>
      <CustomerLoginForm />
    </div>
  );
}
