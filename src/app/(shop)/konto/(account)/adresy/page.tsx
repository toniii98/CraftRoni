import { getCurrentUser } from "@/lib/auth";
import { AddressesManager } from "@/components/account/AddressesManager";

export default async function AccountAddressesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Adresy dostawy</h2>
        <p className="mt-2 text-muted">Zapisz adresy, aby przyspieszyć kolejne zakupy.</p>
      </div>
      <AddressesManager initialAddresses={user.addresses} />
    </div>
  );
}
