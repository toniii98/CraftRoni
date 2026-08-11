import { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = {
  title: "Zwroty i reklamacje",
  description: "Zasady zwrotów i reklamacji w sklepie CraftRoni",
};

export default function ZwrotyPage() {
  return (
    <LegalPage title="Zwroty i reklamacje">
      <section>
        <h2>Zwrot — odstąpienie od umowy (14 dni)</h2>
        <ol>
          <li>
            Jako konsument masz prawo odstąpić od umowy w ciągu <strong>14 dni</strong> od
            otrzymania przesyłki — bez podania przyczyny.
          </li>
          <li>
            Aby skorzystać z tego prawa, wyślij oświadczenie o odstąpieniu na adres
            [UZUPEŁNIJ: adres e-mail] — możesz skorzystać ze wzoru poniżej.
          </li>
          <li>
            Produkt odeślij na adres [UZUPEŁNIJ: adres do zwrotów] w ciągu 14 dni od złożenia
            oświadczenia. Bezpośredni koszt odesłania ponosi kupujący.
          </li>
          <li>
            Zwrócimy Ci wszystkie płatności, w tym koszt najtańszej oferowanej dostawy,
            w ciągu 14 dni od otrzymania oświadczenia (możemy wstrzymać się ze zwrotem do
            czasu otrzymania produktu lub dowodu jego odesłania).
          </li>
          <li>
            Odpowiadasz za zmniejszenie wartości produktu wynikające z korzystania z niego
            w sposób wykraczający poza konieczny do stwierdzenia jego charakteru i cech.
          </li>
        </ol>
      </section>

      <section>
        <h2>Wyjątek — produkty personalizowane</h2>
        <p>
          Prawo odstąpienia <strong>nie przysługuje</strong> w przypadku produktów wykonanych
          według Twojej specyfikacji lub wyraźnie zindywidualizowanych (np. z grawerem, na wymiar,
          w wybranych przez Ciebie kolorach spoza standardowej oferty) — art. 38 ust. 1 pkt 3
          ustawy o prawach konsumenta. Informacja o personalizacji znajduje się zawsze w opisie
          produktu.
        </p>
      </section>

      <section>
        <h2>Wzór oświadczenia o odstąpieniu</h2>
        <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm text-muted whitespace-pre-line">
          {`Adresat: [UZUPEŁNIJ: nazwa i adres sprzedawcy, e-mail]

Ja, ............................................., niniejszym informuję
o odstąpieniu od umowy sprzedaży następujących produktów:
.............................................................
Numer zamówienia: ...........................................
Data odbioru: ...............................................
Imię i nazwisko: ............................................
Adres: ......................................................
Data i podpis (jeśli wysyłane papierowo): ...................`}
        </div>
      </section>

      <section>
        <h2>Reklamacje</h2>
        <ol>
          <li>
            Jeśli produkt jest niezgodny z umową (uszkodzony, wadliwy, niezgodny z opisem),
            przysługuje Ci reklamacja na podstawie ustawy o prawach konsumenta.
          </li>
          <li>
            Reklamację złóż e-mailem na [UZUPEŁNIJ: adres e-mail], podając numer zamówienia,
            opis problemu i — jeśli to możliwe — zdjęcia.
          </li>
          <li>Odpowiemy w ciągu 14 dni od otrzymania reklamacji.</li>
          <li>
            W ramach reklamacji możesz żądać naprawy lub wymiany, a w dalszej kolejności
            obniżenia ceny lub odstąpienia od umowy.
          </li>
        </ol>
        <p className="mt-4">
          Pamiętaj: rękodzieło z natury ma drobne różnice między egzemplarzami (odcień, faktura) —
          nie są one wadą produktu.
        </p>
      </section>
    </LegalPage>
  );
}
