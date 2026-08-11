import { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności sklepu CraftRoni (RODO)",
};

export default function PrywatnoscPage() {
  return (
    <LegalPage title="Polityka prywatności">
      <section>
        <h2>1. Administrator danych</h2>
        <p>
          Administratorem danych osobowych jest [UZUPEŁNIJ: imię i nazwisko / nazwa firmy],
          z siedzibą w [UZUPEŁNIJ: adres], NIP: [UZUPEŁNIJ]. Kontakt w sprawach danych
          osobowych: [UZUPEŁNIJ: adres e-mail].
        </p>
      </section>

      <section>
        <h2>2. Jakie dane zbieramy i po co</h2>
        <ul>
          <li>
            <strong>Dane z zamówienia</strong> (imię i nazwisko, adres e-mail, telefon, adres
            dostawy) — w celu realizacji umowy sprzedaży (art. 6 ust. 1 lit. b RODO).
          </li>
          <li>
            <strong>Dane rozliczeniowe</strong> — w celu wypełnienia obowiązków podatkowych
            i księgowych (art. 6 ust. 1 lit. c RODO).
          </li>
          <li>
            <strong>Dane korespondencji</strong> (e-mail, treść wiadomości) — w celu obsługi
            zapytań i reklamacji (art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Odbiorcy danych</h2>
        <p>Dane przekazujemy wyłącznie podmiotom niezbędnym do realizacji opisanych celów:</p>
        <ul>
          <li>operatorowi płatności — Autopay S.A.,</li>
          <li>dostawcy obsługi formularza kontaktowego — Formspree,</li>
          <li>firmom kurierskim / pocztowym realizującym dostawę: [UZUPEŁNIJ: nazwy przewoźników],</li>
          <li>dostawcy hostingu: [UZUPEŁNIJ: nazwa firmy hostingowej],</li>
          <li>biuru rachunkowemu: [UZUPEŁNIJ lub usuń].</li>
        </ul>
      </section>

      <section>
        <h2>4. Okres przechowywania</h2>
        <p>
          Dane zamówień przechowujemy przez okres wymagany przepisami podatkowymi (co do zasady
          5 lat od końca roku podatkowego). Dane korespondencji — do czasu zakończenia sprawy.
        </p>
      </section>

      <section>
        <h2>5. Twoje prawa</h2>
        <p>Masz prawo do:</p>
        <ul>
          <li>dostępu do swoich danych i otrzymania ich kopii,</li>
          <li>sprostowania (poprawienia) danych,</li>
          <li>usunięcia danych (jeśli nie mamy obowiązku ich przechowywania),</li>
          <li>ograniczenia przetwarzania,</li>
          <li>przenoszenia danych,</li>
          <li>sprzeciwu wobec przetwarzania,</li>
          <li>skargi do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).</li>
        </ul>
      </section>

      <section>
        <h2>6. Pliki cookies i pamięć lokalna</h2>
        <p>
          Sklep używa pamięci lokalnej przeglądarki (localStorage) wyłącznie do przechowywania
          zawartości koszyka oraz niezbędnego pliku cookie sesji dla zalogowanych administratorów.
          Są to mechanizmy technicznie niezbędne do działania sklepu — nie używamy ich do śledzenia
          ani celów marketingowych. [UZUPEŁNIJ/ZAKTUALIZUJ, jeśli dodasz statystyki lub marketing —
          wtedy wymagana jest zgoda i baner cookies.]
        </p>
      </section>

      <section>
        <h2>7. Dobrowolność podania danych</h2>
        <p>
          Podanie danych jest dobrowolne, ale niezbędne do złożenia i realizacji zamówienia.
        </p>
      </section>
    </LegalPage>
  );
}
