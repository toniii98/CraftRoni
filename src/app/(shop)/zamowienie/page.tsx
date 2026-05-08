import { getCurrentUser } from "@/lib/auth";
import { CheckoutPageClient } from "@/components/shop/CheckoutPageClient";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const defaultAddress = user?.addresses.find((address) => address.isDefault) || user?.addresses[0] || null;

  return (
    <CheckoutPageClient
      authenticatedUser={
        user
          ? {
              email: user.email,
              fullName: user.profile?.fullName || user.name || "",
              phone: user.profile?.phone || "",
              defaultAddress,
            }
          : null
      }
    />
  );
}
