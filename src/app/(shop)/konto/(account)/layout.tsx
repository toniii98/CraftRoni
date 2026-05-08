import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/konto/logowanie");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Moje konto</h1>
        <p className="mt-2 text-muted">Zarządzaj profilem, adresami i historią zamówień.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
