import { Metadata } from "next";
import { Truck, CreditCard, Clock } from "lucide-react";
import { getShopSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = {
  title: "Dostawa i płatność",
  description: "Koszty i czas dostawy oraz metody płatności w sklepie CraftRoni",
};

export const dynamic = "force-dynamic";

export default async function DostawaPage() {
  const settings = await getShopSettings();

  return (
    <LegalPage title="Dostawa i płatność">
      <section>
        <h2 className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Dostawa
        </h2>
        <ul>
          <li>
            Koszt standardowej dostawy: <strong>{formatPrice(settings.defaultShippingCost)}</strong>.
          </li>
          <li>
            Darmowa dostawa dla zamówień od{" "}
            <strong>{formatPrice(settings.freeShippingThreshold)}</strong>.
          </li>
          <li>Wysyłamy na terenie Polski za pośrednictwem: [UZUPEŁNIJ: np. InPost Paczkomaty, kurier DPD].</li>
        </ul>
      </section>

      <section>
        <h2 className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Czas realizacji
        </h2>
        <ul>
          <li>
            Produkty dostępne od ręki wysyłamy w ciągu [UZUPEŁNIJ: np. 1–3 dni roboczych] od
            zaksięgowania płatności.
          </li>
          <li>
            Rękodzieło bywa wykonywane na bieżąco — jeśli produkt tworzony jest na zamówienie,
            czas realizacji podany jest w jego opisie.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Płatność
        </h2>
        <ul>
          <li>Płatności online obsługuje Autopay — BLIK, szybkie przelewy i karty płatnicze.</li>
          <li>Płatność następuje bezpośrednio po złożeniu zamówienia.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
