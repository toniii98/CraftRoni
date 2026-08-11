import { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin sklepu internetowego CraftRoni",
};

export default function RegulaminPage() {
  return (
    <LegalPage title="Regulamin sklepu">
      <section>
        <h2>§1. Postanowienia ogólne</h2>
        <ol>
          <li>
            Sklep internetowy CraftRoni, dostępny pod adresem [UZUPEŁNIJ: adres strony],
            prowadzony jest przez [UZUPEŁNIJ: imię i nazwisko / nazwa firmy], z siedzibą
            w [UZUPEŁNIJ: adres], NIP: [UZUPEŁNIJ], REGON: [UZUPEŁNIJ] (dalej: „Sprzedawca”).
          </li>
          <li>
            Kontakt ze Sprzedawcą: e-mail [UZUPEŁNIJ: adres e-mail], telefon [UZUPEŁNIJ: numer].
          </li>
          <li>
            Niniejszy regulamin określa zasady korzystania ze Sklepu oraz zasady zawierania
            umów sprzedaży na odległość za pośrednictwem Sklepu.
          </li>
        </ol>
      </section>

      <section>
        <h2>§2. Produkty</h2>
        <ol>
          <li>
            Produkty oferowane w Sklepie są rękodziełem — wykonywane są ręcznie, przez co
            poszczególne egzemplarze mogą nieznacznie różnić się od zdjęć (odcień, faktura,
            drobne detale). Różnice te nie stanowią wady produktu.
          </li>
          <li>Wszystkie ceny podane w Sklepie są cenami brutto, wyrażonymi w złotych polskich (PLN).</li>
          <li>Cena wiążąca dla stron jest ceną widoczną w chwili złożenia zamówienia.</li>
        </ol>
      </section>

      <section>
        <h2>§3. Składanie zamówień</h2>
        <ol>
          <li>Zamówienia można składać przez stronę Sklepu 24 godziny na dobę, 7 dni w tygodniu.</li>
          <li>Do złożenia zamówienia nie jest wymagane założenie konta.</li>
          <li>
            Złożenie zamówienia następuje po wypełnieniu formularza zamówienia, zaakceptowaniu
            regulaminu i kliknięciu przycisku „Kupuję i płacę” — z tą chwilą po stronie Klienta
            powstaje obowiązek zapłaty.
          </li>
          <li>Po złożeniu zamówienia Klient otrzymuje potwierdzenie na podany adres e-mail.</li>
        </ol>
      </section>

      <section>
        <h2>§4. Płatności</h2>
        <ol>
          <li>
            Płatności online obsługiwane są przez serwis Przelewy24 (PayPro S.A., ul. Pastelowa 8,
            60-198 Poznań) — dostępne metody to m.in. BLIK, szybki przelew i karta płatnicza.
          </li>
          <li>
            Zamówienie nieopłacone w terminie [UZUPEŁNIJ: np. 3 dni roboczych] od złożenia może
            zostać anulowane.
          </li>
        </ol>
      </section>

      <section>
        <h2>§5. Dostawa</h2>
        <ol>
          <li>Dostawa realizowana jest na terenie Polski.</li>
          <li>
            Koszt dostawy widoczny jest w koszyku przed złożeniem zamówienia. Powyżej progu
            wskazanego w Sklepie dostawa jest darmowa.
          </li>
          <li>
            Czas realizacji zamówienia wynosi [UZUPEŁNIJ: np. 1–3 dni roboczych] od zaksięgowania
            płatności. Produkty wykonywane na zamówienie mogą mieć dłuższy czas realizacji, wskazany
            w opisie produktu.
          </li>
        </ol>
      </section>

      <section>
        <h2>§6. Prawo odstąpienia od umowy</h2>
        <ol>
          <li>
            Klient będący konsumentem może odstąpić od umowy w terminie 14 dni od otrzymania
            produktu, bez podania przyczyny. Szczegóły i wzór oświadczenia znajdują się na stronie
            „Zwroty i reklamacje”.
          </li>
          <li>
            Prawo odstąpienia nie przysługuje w odniesieniu do produktów wykonanych według
            specyfikacji Klienta lub służących zaspokojeniu jego zindywidualizowanych potrzeb
            (art. 38 ust. 1 pkt 3 ustawy o prawach konsumenta) — np. produktów personalizowanych.
          </li>
        </ol>
      </section>

      <section>
        <h2>§7. Reklamacje</h2>
        <ol>
          <li>
            Sprzedawca odpowiada za zgodność produktu z umową na zasadach określonych w ustawie
            o prawach konsumenta.
          </li>
          <li>
            Reklamacje można składać na adres e-mail [UZUPEŁNIJ: adres e-mail]. Sprzedawca
            rozpatruje reklamację w terminie 14 dni od jej otrzymania.
          </li>
        </ol>
      </section>

      <section>
        <h2>§8. Dane osobowe</h2>
        <p>
          Zasady przetwarzania danych osobowych opisane są w{" "}
          <a href="/prywatnosc" className="text-primary underline underline-offset-4">
            Polityce prywatności
          </a>.
        </p>
      </section>

      <section>
        <h2>§9. Postanowienia końcowe</h2>
        <ol>
          <li>W sprawach nieuregulowanych regulaminem zastosowanie mają przepisy prawa polskiego.</li>
          <li>
            Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji
            i dochodzenia roszczeń, w tym z platformy ODR: https://ec.europa.eu/consumers/odr.
          </li>
          <li>Regulamin obowiązuje od dnia [UZUPEŁNIJ: data].</li>
        </ol>
      </section>
    </LegalPage>
  );
}
