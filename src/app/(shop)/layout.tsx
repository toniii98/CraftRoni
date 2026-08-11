import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { getShopSettings } from "@/lib/settings";

// Ustawienia (próg darmowej dostawy, koszt wysyłki) mogą się zmieniać w panelu
export const dynamic = "force-dynamic";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getShopSettings();

  return (
    <CartProvider
      freeShippingThreshold={settings.freeShippingThreshold}
      defaultShippingCost={settings.defaultShippingCost}
    >
      <div className="flex min-h-screen flex-col">
        <Header freeShippingThreshold={settings.freeShippingThreshold} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
