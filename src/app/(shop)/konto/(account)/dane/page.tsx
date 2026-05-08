import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function AccountProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dane konta</h2>
        <p className="mt-2 text-muted">Zaktualizuj dane używane w checkout i komunikacji o zamówieniach.</p>
      </div>
      <ProfileForm
        email={user.email}
        initialFullName={user.profile?.fullName || user.name || ""}
        initialPhone={user.profile?.phone || ""}
      />
    </div>
  );
}
