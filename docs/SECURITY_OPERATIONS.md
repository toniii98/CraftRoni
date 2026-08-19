# CraftRoni — Security & Operations

Dokument opisuje stan bezpieczeństwa bieżącego wariantu z Autopay oraz bramki
operacyjne przed uruchomieniem sprzedaży. Nie jest certyfikatem, testem
penetracyjnym ani potwierdzeniem konfiguracji live.

## 1. Zakres i sposób czytania statusu

Stan odniesienia: drzewo robocze `codex/autopay-security`, 2026-08-18, oparte na
`5632388` i zawierające niezatwierdzone jeszcze poprawki bezpieczeństwa.

Statusy używane poniżej:

- **potwierdzone w kodzie** — mechanizm istnieje w przeglądanym drzewie;
- **test lokalny wykonany** — wynik pochodzi z bieżącego drzewa po czystym
  `npm ci --ignore-scripts`; nie jest dowodem działania środowiska live;
- **operacyjnie niezweryfikowane** — repozytorium nie potwierdza ustawień usługi;
- **TBD** — potrzebna decyzja lub dane właściciela;
- **blocker** — nie wolno publicznie włączać checkoutu do zamknięcia punktu.

Jedyną obsługiwaną integracją płatniczą jest Autopay. Checkout gościnny pozostaje
funkcją produktu. `CHECKOUT_ENABLED=false` jest obowiązkowe do chwili pełnej
konfiguracji oraz udokumentowanego sandbox E2E.

Nie wykonano w ramach tego przeglądu uwierzytelnionego odczytu ustawień SEOHOST,
Cloudflare, MySQL/MariaDB, backupów, SMTP ani Autopay. Nie wykonano też testu
odtworzenia kopii ani płatności end-to-end.

## 2. Podsumowanie audytu

| Obszar | Stan | Wniosek |
|--------|------|---------|
| Checkout, rezerwacje i stock | **potwierdzone w kodzie** | Płatność jest ważna 30 minut, ITN ma 15 minut grace, a stock jest zwalniany atomowo po 45 minutach; idempotencja, osobny token wznowienia, walidacja po agregacji i wersjonowanie istnieją, cron pozostaje obowiązkiem wdrożenia |
| Status zamówienia | **potwierdzone w kodzie** | Centralne przejścia, compare-and-swap oraz strukturalne zdarzenia statusu istnieją |
| Autopay ITN | **potwierdzone w kodzie / E2E brak** | Walidacja, rejestr transakcji, obsługa retry/kolizji i limit 192 KiB istnieją; publiczny sandbox ITN nie został sprawdzony |
| Reset/zmiana hasła | **potwierdzone w kodzie** | Zużycie tokenu, zmiana hasła i unieważnienie sesji są transakcyjne; limit bcrypt 72 bajty jest walidowany |
| Rejestracja / weryfikacja e-mail | **kod/testy statyczne obecne / dostawa niezweryfikowana** | Neutralna odpowiedź, brak auto-loginu oraz ustawienie hasła, nazwy i zgody po 24-godzinnym linku istnieją; kompletne SMTP jest wymagane, lecz nie jest skonfigurowane |
| Zależności | **0 podatności w bieżącym snapshotcie** | 2026-08-18 po czystym `npm ci --ignore-scripts` pełny i produkcyjny `npm audit --json` zakończyły się wynikiem 0 |
| Jakość/build | **lokalnie OK** | Node 24.18.0: 33/33 testów, typecheck, ESLint i build Next 16.3.1 przeszły; `.next/BUILD_ID` istnieje. Użyto fikcyjnej niedostępnej bazy, więc nie jest to test live |
| CI / aktualizacje | **kod obecny / zdalnie nieuruchomione** | Workflow powtarza install/audit/test/typecheck/lint/build na Node 24, Dependabot obejmuje npm i Actions; wynik GitHub Actions wymaga pierwszego uruchomienia |
| Node.js | **wymaganie operacyjne** | Lokalnie 24.18.0; produkcja ma używać Node.js 24, a dokładną wersję trzeba odczytać z serwera |
| SEOHOST / Cloudflare / baza / backup | **operacyjnie niezweryfikowane** | Istnieje runbook, ale brak live readback i udanego restore |
| Migracja / live DB | **niezweryfikowane** | Przejrzano schemat i plik migracji; nie potwierdzono jej wykonania ani stanu live DB |
| SMTP | **brak danych konta** | Właściciel deklaruje TLS i SPF/DKIM/DMARC; brak uwierzytelnionego odczytu, danych SMTP i testu dostarczalności. Kod wymusza TLS dla 587 i ma timeout/redakcję błędów |
| Autopay | **TBD** | Brak danych, sandbox E2E i pisemnego potwierdzenia CET/CEST; zwroty są wykonywane w portalu operatora |
| MFA administratora | **TBD** | Aplikacja nie implementuje MFA; wymagana decyzja dla Cloudflare Access i konta awaryjnego |

„Potwierdzone w kodzie” nie oznacza „wdrożone i sprawdzone na produkcji”. Każdy
wynik odbioru musi wskazywać commit, środowisko, czas i osobę wykonującą.

`npm outdated` nie wykazał zaległych wersji w dozwolonych zakresach. Dostępne są
oddzielne migracje głównych wersji Prisma 7, ESLint 10, TypeScript 7 i Lucide 1;
nie są poprawkami audytu i wymagają osobnego planu kompatybilności. Typy Node 26
pozostają poza zakresem, ponieważ docelowy runtime to Node 24.

## 3. Dane i granice zaufania

| Obszar | Dane | Zasada |
|--------|------|--------|
| `User` | e-mail, nazwa, hash hasła, rola | nigdy nie przechowujemy hasła jawnego |
| `Session` | hash tokenu, użytkownik, wygaśnięcie | surowy JWT pozostaje w cookie klienta |
| `PasswordResetToken` | hash tokenu, wygaśnięcie, użycie | surowy token występuje tylko w linku wysłanym klientowi |
| `Order` | dane kontaktowe i adresowe, notatki, kwoty, status | PII także dla gościa (`userId = null`); minimalizować logi i retencję |
| `AutopayTransaction` | identyfikatory, kwota, waluta, status | dane rozliczeniowe; bez danych karty |
| `PaymentReviewCase` | `RemoteID`, powód, decyzja, referencja, aktor i czas | osobna, audytowalna sprawa dla każdej nietypowej płatności lub legacy |
| `OrderStatusEvent` | przejście, aktor, powód i czas | log audytowy; dostęp tylko dla uprawnionego operatora |
| Uploady | publiczne zdjęcia produktów/kategorii | bez dokumentów klienta, sekretów i PII |
| `Setting` | dane kontaktowe i parametry sklepu | klucze integracji nie trafiają do bazy ustawień |

Granice odpowiedzialności:

- przeglądarka ↔ Cloudflare/Access/WAF ↔ Passenger/Next.js: HTTPS, cache, limity,
  poprawny adres klienta i dostęp administratora;
- aplikacja ↔ MySQL/MariaDB: prywatna ekspozycja, najmniejsze uprawnienia, migracje,
  backup i odtworzenie;
- aplikacja ↔ SMTP: osobne konto, TLS, SPF/DKIM/DMARC, rotacja i dostarczalność;
- aplikacja ↔ Autopay: rozdział sandbox/produkcja, publiczny ITN i uzgodnienia;
- aplikacja ↔ system plików: trwały wolumen uploadów, quota, prawa i backup.

## 4. Kontrole potwierdzone w kodzie

### Tożsamość i sesje

- brak `AUTH_SECRET` zatrzymuje ścieżki uwierzytelniania; nie ma znanego fallbacku;
- JWT jest podpisany, cookie ma `httpOnly`, `sameSite=lax`, `secure` w produkcji
  i termin 7 dni;
- baza przechowuje SHA-256 tokenu sesji, a panel i API sprawdzają także rekord
  sesji i rolę;
- hasła używają bcrypt cost 12; walidacja ogranicza je do 72 bajtów UTF-8;
- token resetu ma 32 losowe bajty, w bazie jest tylko hash i termin jednej godziny;
- utworzenie kolejnego tokenu jest transakcyjne, a reset atomowo zużywa token,
  ustawia hasło i unieważnia sesje;
- zmiana hasła administratora używa warunkowego zapisu i w tej samej transakcji
  unieważnia pozostałe sesje oraz tokeny resetu;
- odpowiedź na prośbę o reset nie potwierdza istnienia konta.
- rejestracja klienta nie przyjmuje ani nie ustawia hasła przed dowodem własności
  adresu, nie wykonuje auto-loginu i nie ujawnia, czy konto już istnieje; klient
  ustawia hasło, podaje nazwę i akceptuje regulamin dopiero po zużyciu
  zahashowanego, 24-godzinnego tokenu aktywacji; konto zapisuje czas i wersję zgody,
  a ponowne zgłoszenie tworzy kolejny token bez unieważniania ważnego poprzednika;
- rejestracja wymaga kompletnej konfiguracji SMTP; checkout gościnny nie wymaga konta.

### Checkout, zamówienia i magazyn

- checkout można zamknąć flagą; w produkcji brak flagi nie otwiera sprzedaży;
- utworzenie zamówienia wymaga kompletnej konfiguracji Autopay i klucza
  idempotencji; hash klucza oraz hash żądania są unikalnie zapisane;
- duplikaty produktów są agregowane przed limitem ilości, a ceny/dostawa są
  liczone po stronie serwera; maksymalna kwota 75 000 PLN mieści się w limitach
  podstawowych PBL/karta/fast transfer/BLIK, natomiast dostępność kanałów z niższym
  limitem (np. płatności odroczonych) musi zostać sprawdzona w konfiguracji usługi;
- aktywny produkt i kategoria są sprawdzane przy zakupie;
- płatność Autopay jest ważna 30 minut; dodatkowe 15 minut grace pozwala odebrać
  opóźniony ITN, więc rezerwacja `PENDING` i stock wygasają po 45 minutach;
  `orders:expire` zwalnia stock warunkowo tylko raz;
- wersje zamówienia i produktu chronią przed równoległym anulowaniem oraz zapisem
  starego stocku z formularza edycji;
- centralna tabela przejść ogranicza zmiany administratora, a `OrderStatusEvent`
  zapisuje aktora, czas, stan przed/po i powód;
- publiczny endpoint zwracający pełny rekord zamówienia został usunięty;
- numer zamówienia i klucz checkoutu są generowane kryptograficznie;
- token wznowienia płatności jest osobnym HMAC wyprowadzonym serwerowo z zapisanego
  `checkoutKeyHash` i niezależnego `PAYMENT_ACCESS_SECRET`; nie używa
  `AUTH_SECRET`, a baza nie przechowuje samego tokenu ani jego hasha;
- link e-mail prowadzi przez trasę startową, która po weryfikacji ustawia krótkie
  cookie `HttpOnly`, `SameSite=Lax` (`Secure` w produkcji) i usuwa sekret z query;
- checkout gościnny pozostaje obsługiwany, a konto klienta wiąże historię przez
  `userId`.

### Autopay ITN

- endpoint akceptuje `application/x-www-form-urlencoded` i czyta maksymalnie
  192 KiB, także przy transferze strumieniowym;
- parser ogranicza rozmiar zakodowanego XML i odrzuca nieobsługiwane konstrukcje;
- weryfikowane są podpis, service ID, kwota, waluta, metoda i zamówienie;
- `(serviceId, remoteId)` jest unikalnym identyfikatorem transakcji, a stan
  `SUCCESS` nie jest cofany przez późniejszy status słabszy;
- tylko atomowe przejście aktywnego `PENDING` może ustawić `PAID` i wysłać
  pojedynczy e-mail;
- późna płatność po zwolnieniu stocku i wielokrotny sukces nie zmieniają
  automatycznie magazynu; zamówienie otrzymuje flagę ręcznego uzgodnienia;
- każdy przypadek uzgodnienia ma jawny rodzaj zdarzenia i jest związany z konkretnym
  `RemoteID`; administrator może zaakceptować płatność (`PAYMENT_ACCEPTED`) tylko
  dla uzgodnienia ITN albo potwierdzić zwrot (`REFUND_CONFIRMED`) dla sprawy zwrotu,
  podając referencję i oczekiwaną wersję; transakcja wykonuje CAS, kontroluje
  ponowną rezerwację/zwolnienie stocku i zapisuje audyt;
- `NO_PAYMENT_FOUND` jest dopuszczone wyłącznie dla legacy `PENDING`, dla którego
  nie istnieje zarejestrowana płatność;
- relacje `AutopayTransaction`, `PaymentReviewCase` i `OrderStatusEvent` mają
  `ON DELETE RESTRICT`, więc rekordy finansowe/audytowe nie znikają kaskadowo;
- odpowiedzi ITN mają `Cache-Control: no-store`.

### Żądania, proxy, uploady i nagłówki

- unsafe methods `/api/admin/*` są w produkcji ograniczone do dokładnego originu
  i `Sec-Fetch-Site: same-origin`; checkout ma tę samą kontrolę;
- checkout i zapis statusu mają limit JSON 64 KiB oraz wymagany Content-Type;
- rate limiter ma twardy limit 10 000 bucketów i używa wyłącznie poprawnego,
  pojedynczego `CF-Connecting-IP`;
- upload wymaga administratora, allowlisty katalogu i formatów, maks. 10 plików po
  5 MB, podstawowej sygnatury pliku oraz serwerowej nazwy;
- SMTP wymusza TLS na porcie 587, TLS 1.2+, ogranicza timeouty i loguje wybrane
  kody błędu zamiast surowego obiektu;
- globalnie ustawiono CSP z allowlistą źródeł, HSTS, zakaz osadzania, `nosniff`,
  `no-referrer` i ograniczenia uprawnień; API, panel i konto mają
  `Cache-Control: no-store`;
- `.gitignore` obejmuje warianty `.env` (z wyjątkiem przykładu) i typowe lokalne
  dumpy/kopie bazy.

## 5. Otwarte ryzyka i decyzje

1. **[HIGH / blocker operacyjny] Brak odbioru środowiska.** Cloudflare Access/WAF,
   izolacja originu, SEOHOST/Passenger, baza, backup/restore, monitoring, SMTP i
   Autopay nie zostały zweryfikowane live. `CHECKOUT_ENABLED=false` musi pozostać
   zabezpieczeniem do zamknięcia całej checklisty.
2. **[LOW/MEDIUM / operacyjne] Jakość i przechowywanie sekretów.** Kod odrzuca
   `AUTH_SECRET` i `PAYMENT_ACCESS_SECRET` krótsze niż 32 bajty, ale nie może
   potwierdzić ich entropii, rozdziału między środowiskami, ACL ani bezpiecznej
   rotacji. Te właściwości wymagają dowodu wdrożeniowego.
3. **[MEDIUM] Rate limiting jest lokalny.** Twardy cap ogranicza pamięć, lecz stan
   nie jest współdzielony między procesami/instancjami. `CF-Connecting-IP` jest
   wiarygodny tylko wtedy, gdy origin nie przyjmuje ruchu poza Cloudflare.
4. **[MEDIUM] Nierówne limity body.** ITN i checkout mają limity w kodzie, ale
   część tras auth/admin nadal parsuje całe JSON/multipart. Proxy musi mieć
   globalne, dopasowane limity; upload powinien docelowo streamować lub ograniczać
   całe multipart przed alokacją.
5. **[MEDIUM] Obróbka obrazów jest podstawowa.** Magic bytes nie zastępują pełnego
   dekodowania/re-enkodowania, limitu liczby pikseli ani usuwania EXIF/GPS.
6. **[LOW/MEDIUM] CSP wymaga dalszego utwardzenia.** Nagłówek ogranicza źródła,
   formularze, ramki i obiekty, lecz obecny frontend wymaga `unsafe-inline` dla
   skryptów i stylów. Przed zawężeniem do nonce/hash potrzebny jest test regresji UI.
7. **[MEDIUM] MFA administratora jest TBD.** Kod aplikacji nie zapewnia drugiego
   składnika. Do decyzji pozostają polityka Cloudflare Access, grupa administratorów,
   MFA i kontrolowane konto awaryjne.
8. **[MEDIUM / operacyjne] Weryfikacja e-mail bez danych konta SMTP.** Kod
   rejestracji ma neutralną odpowiedź, brak auto-loginu i 24-godzinny link, lecz
   brakuje danych SMTP, a deklarowane rekordy domenowe i dostawa nie zostały
   sprawdzone live. Do odbioru pozostają
   wygaśnięcie/ponowienie linku, awarie wysyłki i cały lifecycle konta. Checkout
   gościnny ma pozostać niezależny.
9. **[MEDIUM] Retencja i prawa osób są TBD.** Kod nie wdraża uzgodnionych terminów
    usuwania/anonymizacji zamówień, kont, logów i wygasłych rekordów.
10. **[LOW/MEDIUM] Token wznowienia występuje chwilowo w URL linku e-mail.** Jest
    osobnym HMAC wyprowadzonym z zapisanego `checkoutKeyHash`; baza nie zapisuje
    tokenu ani jego hasha, a trasa startowa przenosi go do cookie `HttpOnly` i usuwa
    z adresu. Nadal jest bearerem w skrzynce i pierwszym żądaniu, więc operator musi
    redagować query w logach, monitoringu i zgłoszeniach.
11. **[LOW] Brak automatycznych refundów.** Przypadek jest przypisany do `RemoteID`,
    a administrator zapisuje `REFUND_CONFIRMED` z referencją, lecz sam zwrot wykonuje
    się ręcznie w portalu Autopay. Potrzebna jest procedura właściciela, SLA i
    kontrola podwójna.
12. **[HIGH / release gate] Semantyka czasu Autopay i DST.** Kod traktuje
    `ValidityTime` oraz `paymentDate` literalnie jako stałe CET (UTC+1), również
    latem. Nie zweryfikowano, czy operator oczekuje stałego CET, czy cywilnego
    CET/CEST. Przed release wymagane są letni sandbox E2E i pisemne potwierdzenie
    Autopay; do tego czasu checkout pozostaje wyłączony.
13. **[HIGH / release gate] Nierozpoznane dane historycznych płatności.** Migracja
    tworzy sprawy uzgodnienia dla wszystkich dawnych `PENDING` oraz anulowanych
    zamówień z `paidAt`, ale nie potrafi ustalić operatora po samych polach legacy.
    Przed wdrożeniem wymagany jest odczytowy raport
    `status × paymentMethod × paidAt × paymentId`, uzgodnienie z operatorem i próba
    migracji na odtworzonej kopii. Bez tego może powstać błędna sprawa/refund.

## 6. Wymagana konfiguracja Cloudflare

W czasie odbioru cały host pozostaje za Cloudflare Access. Utwórz osobną, bardziej
szczegółową aplikację Access dla jednego dokładnego endpointu; zgodnie z
[regułami ścieżek Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
bardziej szczegółowa ścieżka ma pierwszeństwo. Jedynym publicznym wyjątkiem jest:

```text
/api/payments/autopay/itn
```

Wyjątek typu `Bypass / Everyone` ma usunąć interaktywny challenge wyłącznie dla tej
ścieżki. Cloudflare ostrzega, że Bypass wyłącza kontrolę i log Access, dlatego nie
wyłączaj WAF, nie rozszerzaj reguły na prefiks i zachowaj osobne logi WAF/HTTP.
Dopuść `POST`, zachowaj HTTPS oraz pozostałe bezpieczne reguły. Aplikacja ogranicza
body do 192 KiB; na warstwie proxy zalecany jest limit około 256 KiB. Możliwość
użycia pola `http.request.body.size` zależy od planu Cloudflare, więc limit musi też
obowiązywać na SEOHOST/serwerze aplikacji.

„Origin” oznacza właściwy serwer SEOHOST za Cloudflare. Sam pomarańczowy rekord DNS
nie blokuje wejścia bezpośrednio na jego IP. Poproś SEOHOST o jedną z obsługiwanych
metod: blokadę ruchu spoza aktualnych zakresów Cloudflare albo Authenticated Origin
Pulls; następnie niezależnie sprawdź, że żądanie bezpośrednio do originu nie działa.
[Cloudflare opisuje te opcje i ograniczenia](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/).
Dopóki origin nie jest zamknięty, `CF-Connecting-IP` nie jest wiarygodną podstawą
limitowania. Ustal też liczbę procesów Passenger: limiter w pamięci działa osobno w
każdym procesie, więc dla wielu procesów potrzebna jest reguła rate limit w WAF lub
współdzielony magazyn limitów.

Wymagane odczyty/testy live:

- Access odrzuca anonimowy dostęp do każdej innej trasy;
- ITN nie otrzymuje HTML, przekierowania logowania ani challenge;
- origin ma poprawny certyfikat i jest niedostępny z pominięciem Cloudflare;
- `CF-Connecting-IP` nie może zostać narzucony przez klienta docierającego bezpośrednio;
- `/api/*`, `/admin*`, `/konto*` i odpowiedzi sesyjne nie są cache'owane;
- limit proxy przepuszcza poprawny ITN, a odrzuca zbyt duże body;
- HSTS z `includeSubDomains` jest bezpieczny dla wszystkich objętych nazw.

Nie zapisuj jako „zweryfikowane” ustawień widocznych tylko w dokumentacji lub
zrzucie ekranu bez daty. Potrzebny jest aktualny odczyt oraz test z zewnątrz.

## 7. Checklista przed produkcją

### Rewizja i zależności

- [ ] Release jest przypięty do konkretnego commita; docs, kod, Prisma i lockfile
      pochodzą z tego samego drzewa.
- [ ] Produkcja używa Node.js 24; zapisano dokładną wersję z SEOHOST.
- [ ] Wykonano czyste `npm ci --ignore-scripts` i jawne `prisma generate`; oba
      audyty powtórzono i rozliczono każdy wynik.
- [ ] `npm run test`, `npx tsc --noEmit`, `npm run lint` i `npm run build` przeszły;
      `.next/BUILD_ID` istnieje.
- [ ] Testy współbieżności obejmują podwójny checkout, równoległe anulowanie,
      edycję stocku podczas zakupu, retry ITN, późną płatność i oba rozstrzygnięcia
      alertu płatniczego.
- [ ] Pipeline i logi nie wypisują sekretów ani danych klientów.

### Konfiguracja i sekrety

- [ ] `APP_ENV=production`; `NEXT_PUBLIC_APP_URL` to dokładny publiczny origin HTTPS.
- [ ] `CHECKOUT_ENABLED=false` do formalnej decyzji po pełnym odbiorze.
- [ ] `AUTH_SECRET` ma co najmniej 32 losowe bajty i jest inny niż w dev/staging.
- [ ] `PAYMENT_ACCESS_SECRET` ma niezależne co najmniej 32 losowe bajty, różni się
      od `AUTH_SECRET` i między środowiskami.
- [ ] Baza, SMTP i Autopay mają osobne dane dla każdego środowiska.
- [ ] `.env` ma minimalne ACL; nie występuje w Git, artefaktach, backupie bez
      szyfrowania, logach ani zgłoszeniach.
- [ ] Skan sekretów obejmuje bieżące pliki, historię Git i artefakty.
- [ ] Istnieje procedura rotacji; rotacja `AUTH_SECRET` wyloguje klientów, a rotacja
      `PAYMENT_ACCESS_SECRET` unieważni dotychczasowe linki wznowienia płatności.

### Cloudflare, aplikacja i administrator

- [ ] Cały host jest za Access, z jednym dokładnym wyjątkiem
      `/api/payments/autopay/itn`; inne trasy odrzucają anonimowy ruch.
- [ ] ITN nie dostaje challenge; limit aplikacji 192 KiB i proxy ok. 256 KiB
      przeszły test pozytywny i negatywny.
- [ ] SSL/TLS Full (strict), origin isolation, `CF-Connecting-IP`, cache i HSTS
      zostały zweryfikowane live.
- [ ] Proces Node działa bez uprawnień root/admin; baza nie jest publiczna.
- [ ] MFA administratora, grupa Access, odebranie dostępu i konto awaryjne są
      uzgodnione oraz przetestowane (**obecnie TBD**).
- [ ] Trasy auth/admin, upload i checkout przeszły testy autoryzacji, originu,
      Content-Type, limitów i błędnych danych.
- [ ] Logi/monitoring redagują cookies, token resetu, token wznowienia płatności,
      query z PII, dane adresowe oraz klucze integracji.

### Baza, stock i backup

- [ ] Konto runtime ma minimalne prawa; konto/okno migracji jest odseparowane.
- [ ] Przed migracją wykonano kopię bazy i uploadów oraz udany restore do
      odseparowanego środowiska.
- [ ] Migrację bezpieczeństwa przetestowano na kopii, w tym świadome
      unieważnienie istniejących linków resetu.
- [ ] Test migracji potwierdził `RESTRICT` dla transakcji, przypadków uzgodnienia
      i zdarzeń statusu;
      wykonanie na live DB pozostaje osobnym, udokumentowanym krokiem.
- [ ] Nie użyto `db push`, resetu ani rutynowego seeda.
- [ ] Cron `npm run orders:expire` działa co 5 minut i ma alert na błąd/brak uruchomień.
- [ ] Test expiry potwierdził pojedynczy zwrot stocku i wpis historii statusu.
- [ ] Uploady są na trwałym wolumenie, mają minimalne prawa, quota i backup.
- [ ] RPO/RTO są jawnie zaakceptowane; wynik restore zawiera datę i czas.

### Autopay, SMTP i dane osobowe

- [ ] Autopay (**TBD**) przeszedł sandbox E2E: sukces, odrzucenie, porzucenie,
      retry, równoległy retry oraz późna płatność po zwolnieniu stocku.
- [ ] Letni sandbox E2E i pisemna odpowiedź Autopay rozstrzygają CET/CEST dla
      `ValidityTime` i `paymentDate`; bieżący kod używa literalnego CET (UTC+1).
- [ ] Link wznowienia płatności ustawia cookie `HttpOnly`, usuwa sekret z query
      i odrzuca niezgodny token; wynik nie ujawnia sekretu w dowodach.
- [ ] Przypadki per `RemoteID` oraz decyzje `PAYMENT_ACCEPTED`/`REFUND_CONFIRMED`
      wymagają referencji, wykonują CAS, zachowują właściwy stock i tworzą
      audytowalny wpis; `NO_PAYMENT_FOUND` jest możliwe tylko dla legacy bez
      płatności.
- [ ] Przed migracją zapisano raport historycznych zamówień według
      `status × paymentMethod × paidAt × paymentId`, potwierdzono operatora i
      przećwiczono obsługę legacy na odtworzonej kopii.
- [ ] Produkcyjne dane Autopay są odrębne; `AUTOPAY_SANDBOX=false` przy produkcji.
- [ ] Zwroty ręczne mają właściciela, podwójną kontrolę, SLA i uzgodnienie z bazą.
- [ ] SMTP (**obecnie brak danych konta**) przeszedł test TLS/certyfikatu, SPF,
      DKIM, DMARC i dostawy wiadomości zamówienia, płatności, wysyłki oraz resetu.
- [ ] Rejestracja wymaga kompletnego SMTP, nie przyjmuje hasła przed potwierdzeniem
      adresu, zwraca neutralną odpowiedź i nie tworzy sesji; sprawdzono ustawienie
      hasła przez ważny 24-godzinny link, ponowienie/replay, wygaśnięcie i dostawę.
- [ ] Strony prawne nie zawierają placeholderów; dane sprzedawcy i proces zwrotów
      zatwierdziła właściwa osoba.
- [ ] Zatwierdzono podstawy prawne, retencję, eksport/usunięcie danych, odbiorców
      i procedurę naruszeń.

### Monitoring i aktywacja

- [ ] Alerty obejmują 5xx, logowanie/reset, flagę uzgodnienia płatności, SMTP,
      brak crona, bazę, dysk, proces i nieudany backup.
- [ ] Z zewnętrznej sieci wykonano smoke test i zapisano commit, czas, środowisko
      oraz wykonawcę.
- [ ] Kontakt incydentowy, właściciel checkoutu i eskalacja są znane.
- [ ] Właściciel jawnie zaakceptował przełączenie `CHECKOUT_ENABLED=true`.

## 8. Backup i odtworzenie

Kopia obejmuje spójny punkt bazy, `public/uploads/products`,
`public/uploads/categories`, wersję kodu i migracji potrzebną do odtworzenia.
Musi być szyfrowana, przechowywana poza kontem/hostem aplikacji i monitorowana.

RPO oznacza, ile ostatnich danych można maksymalnie utracić. RTO oznacza, jak długo
usługa może być niedostępna. Propozycja do akceptacji właściciela:

- RPO bazy: **15 minut** po uruchomieniu sprzedaży;
- RPO uploadów: **24 godziny** oraz kopia po większej zmianie katalogu;
- RTO sklepu: **4 godziny**.

Test restore wykonuj do odseparowanego środowiska. Potwierdź relacje i liczby
zamówień/pozycji, przykładowe obrazy, logowanie oraz uruchomienie aplikacji. Kopia
bez udanego, udokumentowanego odtworzenia nie jest potwierdzonym backupem.

## 9. Bezpieczny release i utrzymanie

Przed każdym releasem:

```bash
npm ci --ignore-scripts --include=dev
npm audit --omit=dev
npm audit --json
npm run test
npx tsc --noEmit
npm run lint
npm run build
```

Przed migracją wykonaj i odtwórz kopię. Stosuj `npm run db:migrate:deploy` dopiero
po teście migracji na kopii. Nie uruchamiaj rutynowo `npm run db:seed`; nie używaj
`prisma db push` ani resetów produkcyjnej bazy.

Po releasie sprawdź commit, Node.js, `.next/BUILD_ID`, TLS, nagłówki, Access,
dokładny wyjątek ITN, cache, cron, wolumen uploadów i alerty. Obserwuj logi bez
zapisywania sekretów/PII. Sam build nie potwierdza gotowości środowiska.

## 10. Reakcja na incydent

1. Ogranicz dotknięty komponent; w razie ryzyka transakcyjnego ustaw
   `CHECKOUT_ENABLED=false`. Nie niszcz logów ani dowodów.
2. Ustal commit, środowisko, czas, konta, rekordy, płatności i potencjalnie ujawnione
   sekrety.
3. Obróć zagrożone `AUTH_SECRET`, `PAYMENT_ACCESS_SECRET` oraz dane dostępowe bazy,
   SMTP, Autopay i Cloudflare, uwzględniając unieważnienie sesji/linków.
4. Unieważnij sesje i tokeny według zakresu; nie usuwaj danych potrzebnych do analizy.
5. Uzgodnij płatności oznaczone do ręcznego review z portalem operatora i księgowością.
6. Przywróć poprawkę lub znaną dobrą wersję, zweryfikuj ją niezależnym testem i
   monitoruj ponowne wystąpienie.
7. Oceń obowiązki wobec klientów, procesorów i organów według przyjętej procedury.
8. Po incydencie popraw kontrolę, test i runbook, a nie tylko symptom.

Kontakt bezpieczeństwa, kanał eskalacji, właściciel decyzji i docelowe czasy
reakcji pozostają **TBD**.

## 11. Dane potrzebne od właściciela

Bez podawania sekretów potrzebne są:

1. potwierdzenie topologii SEOHOST/Passenger, liczby procesów i sposobu restartu;
2. aktualny odczyt reguł Cloudflare Access/WAF/cache i izolacji originu;
3. model kont bazy runtime/migrator oraz ekspozycja sieciowa/TLS;
4. status danych sandbox i produkcyjnych Autopay (**TBD**) oraz termin E2E;
5. dane konta SMTP, domenę nadawcy oraz test rejestracji i dostarczalności
   (**obecnie brak konfiguracji**);
6. decyzja o MFA administratora i koncie awaryjnym (**TBD**);
7. miejsce backupu, częstotliwość, retencja i akceptacja proponowanych RPO/RTO;
8. właściciel monitoringu, crona, refundów i incydentów;
9. zatwierdzone okresy retencji, procedury eksportu/usunięcia danych i dokumenty
   prawne;
10. oczekiwany zakres testu penetracyjnego/DAST oraz termin publicznego startu.

Odpowiedzi zapisujemy jako `potwierdzone`, `wnioskowane` lub `TBD`. Usługę live
uznajemy za zweryfikowaną dopiero po uwierzytelnionym odczycie konfiguracji i
niezależnym teście z zewnątrz.
