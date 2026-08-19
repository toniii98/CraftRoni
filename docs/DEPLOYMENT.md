# Wdrożenie CraftRoni na SEOHOST

Runbook dotyczy bieżącego wariantu z Autopay, DirectAdmin/Passenger,
MySQL/MariaDB i Cloudflare przed domeną. Wymaga **Node.js 24**. Opisuje stan
docelowy; nie potwierdza, że SEOHOST, Cloudflare, baza, SMTP, Autopay ani backup
zostały sprawdzone na żywo.

Do czasu zamknięcia checklisty:

- `APP_ENV=production`,
- `CHECKOUT_ENABLED=false`,
- cała aplikacja za Cloudflare Access,
- jedyny publiczny wyjątek: dokładnie `/api/payments/autopay/itn`.

Brak danych konta SMTP; TLS i SPF/DKIM/DMARC są zadeklarowane przez właściciela,
ale niezweryfikowane live. Dane Autopay i sposób MFA administratora mają
status **TBD**. Nie włączaj checkoutu na podstawie samego udanego buildu.

## 1. Bramka zmian i odpowiedzialność

Przed rozpoczęciem zapisz w zgłoszeniu wdrożeniowym:

- commit i branch przeznaczone do wdrożenia,
- osobę wykonującą oraz osobę akceptującą uruchomienie sprzedaży,
- okno wdrożeniowe i sposób powrotu do poprzedniej wersji aplikacji,
- lokalizację najnowszej kopii oraz wynik próbnego odtworzenia,
- wyniki `npm audit`, testów, lint, typecheck i buildu dla tego commita,
- status: `potwierdzone`, `niezweryfikowane` albo `TBD` dla SEOHOST, Cloudflare,
  bazy, SMTP, Autopay, monitoringu i backupów.

Nie umieszczaj w takim zapisie sekretów, pełnych danych klientów, ciasteczek,
tokenów ani treści `.env`.

## 2. Katalog aplikacji i Node.js

Kod pozostaje poza katalogiem publicznym domeny, przykładowo:

```text
/home/USER/CraftRoni
```

Nie kopiuj projektu ani `.env` do `public_html` lub `private_html`. W kreatorze
„Node.js App” ustaw:

- Node.js: linia **24** (zapisz dokładną wersję zwróconą przez serwer),
- tryb: `Production`,
- katalog aplikacji: `CraftRoni`,
- URL: właściwa domena bez dodatkowej ścieżki,
- plik startowy: `server.cjs`.

Port przekazuje Passenger. Nie uruchamiaj równolegle trwałego `npm start` w
terminalu. Proces ma działać jako nieuprzywilejowane konto, a origin nie może być
dostępny z Internetu z pominięciem Cloudflare.

Po pobraniu zatwierdzonej rewizji utwórz plik środowiskowy z restrykcyjnymi
uprawnieniami:

```bash
cd /home/USER/CraftRoni
umask 077
cp -n .env.example .env
chmod 600 .env
```

Nie kopiuj gotowego `.env` z developmentu ani stagingu. Każde środowisko ma
osobne sekrety, bazę, SMTP i dane operatora płatności.

## 3. Konfiguracja produkcyjna

Minimalna bezpieczna konfiguracja przed odbiorem:

```env
DATABASE_URL="mysql://USER:HASLO@HOST:3306/BAZA"
NEXT_PUBLIC_APP_URL="https://twoja-domena.pl"
APP_ENV="production"
CHECKOUT_ENABLED="false"
AUTH_SECRET="LOSOWY_SEKRET_CO_NAJMNIEJ_32_BAJTY"
PAYMENT_ACCESS_SECRET="INNY_LOSOWY_SEKRET_CO_NAJMNIEJ_32_BAJTY"
```

`NEXT_PUBLIC_APP_URL` ma być dokładnym originem HTTPS: bez ścieżki, query,
danych logowania i końcowych przekierowań na inną domenę. `AUTH_SECRET` i
`PAYMENT_ACCESS_SECRET` wygeneruj niezależnie z kryptograficznie bezpiecznego
źródła, nie używaj tej samej wartości i przechowuj oba poza repozytorium. Rotacja
`AUTH_SECRET` wyloguje użytkowników; rotacja `PAYMENT_ACCESS_SECRET` unieważni
dotychczasowe linki wznowienia płatności.

Nie polegaj wyłącznie na walidacji runtime: bieżące ścieżki uwierzytelniania
wymagają niepustego `AUTH_SECRET`, ale nie wszystkie wywołują kontrolę minimum
32 bajtów. Checklistę konfiguracji traktuj jako obowiązkową kontrolę operacyjną.

Konfiguracji SMTP obecnie brak, a dane Autopay są **TBD**. Uzupełnij je dopiero po
otrzymaniu właściwych danych. Sandbox i produkcja muszą być odrębne. Produkcja
używa `AUTOPAY_SANDBOX=false`; kod odrzuca sandbox przy `APP_ENV=production`.

## 4. Cloudflare Access, WAF i limity

W fazie wdrożenia i odbioru Cloudflare Access chroni cały host. Utwórz dokładnie
jeden publiczny wyjątek dla komunikatów operatora:

```text
/api/payments/autopay/itn
```

Zasady dla wyjątku:

- tylko ta dokładna ścieżka; nie cały prefiks `/api/payments/` ani `/api/`,
- brak logowania Access, interaktywnego challenge i reguły przepisującej body,
- pozostałe reguły WAF, HTTPS i rejestrowanie zdarzeń nadal obowiązują,
- dopuszczona metoda `POST`; nie dodawaj szerokiego wyjątku dla całej aplikacji,
- limit body w aplikacji wynosi **192 KiB**; na Cloudflare/reverse proxy ustaw
  około **256 KiB**, aby uwzględnić narzut formularza bez osłabiania limitu,
- po zmianie potwierdź z zewnętrznej sieci, że ITN nie dostaje strony HTML/challenge,
  a inne trasy nadal wymagają Access.

Ustaw SSL/TLS `Full (strict)`, poprawny certyfikat origin i brak cache dla
`/api/*`, `/admin*`, `/konto*` oraz odpowiedzi zależnych od cookie. Origin powinien
akceptować ruch wyłącznie z zaufanej drogi Cloudflare. Aplikacyjny limiter używa
`CF-Connecting-IP`; bez tej izolacji nagłówek nie jest wiarygodną tożsamością
klienta.

MFA w aplikacji nie istnieje. Wymagana metoda MFA w Cloudflare Access, reguła dla
administratorów i procedura konta awaryjnego pozostają **TBD** do decyzji
właściciela.

## 5. Backup, RPO/RTO i migracje

Migracji nie wolno uruchamiać tylko dlatego, że build się powiódł. Najpierw:

1. wykonaj spójną kopię bazy i `public/uploads/products` oraz
   `public/uploads/categories`;
2. zaszyfruj kopię i zapisz ją poza kontem/hostem aplikacji;
3. odtwórz kopię do odseparowanego środowiska;
4. sprawdź liczbę zamówień i pozycji, relacje, przykładowe obrazy, logowanie oraz
   uruchomienie aplikacji;
5. zapisz datę, czas odtworzenia, osobę wykonującą i wynik;
6. dopiero wtedy uruchom migracje na produkcji.

RPO to maksymalny akceptowany okres utraty nowych danych po awarii. RTO to
maksymalny czas potrzebny na przywrócenie usługi. Propozycja do jawnej akceptacji:

- **RPO bazy: 15 minut** po włączeniu checkoutu,
- **RPO uploadów: 24 godziny** (oraz kopia po większej zmianie katalogu),
- **RTO całego sklepu: 4 godziny**.

To cele, nie stan potwierdzony. Jeśli SEOHOST nie umożliwia ich osiągnięcia,
właściciel musi zaakceptować inne wartości albo zmienić mechanizm backupu przed
uruchomieniem sprzedaży.

Plik bieżącej migracji bezpieczeństwa unieważnia istniejące linki resetu hasła,
dodaje weryfikację e-mail, wersjonowanie stocku/zamówień, dane do bezpiecznego
wznowienia płatności, przypadki uzgodnienia per zdarzenie i `RemoteID`, transakcje
Autopay oraz log statusów. Istniejący administratorzy zachowują zweryfikowany
status operacyjny. Istniejące konta klientów nie są uznawane za zweryfikowane bez
dowodu własności adresu: ich sesje są usuwane, a aktywacja wymaga neutralnej
rejestracji, otwarcia 24-godzinnego linku i ustawienia hasła. Relacje transakcji
płatniczych, przypadków uzgodnienia oraz zdarzeń statusu używają
`ON DELETE RESTRICT`, aby usunięcie zamówienia nie skasowało kaskadowo rekordów
finansowych/audytowych.

Migracja tworzy również ręczne sprawy dla wszystkich historycznych `PENDING` oraz
anulowanych zamówień z `paidAt`. Nie zna pochodzenia starych płatności. Przed jej
wdrożeniem wykonaj na live DB wyłącznie odczytowy raport liczebności według
`status`, `paymentMethod`, `paidAt` i `paymentId`, uzgodnij te rekordy z właściwym
operatorem i zatwierdź plan importu/obsługi. Bez tego migracja pozostaje bramką
release; nie uruchamiaj jej w ciemno.

To opis pliku w repozytorium — **nie potwierdza wykonania migracji ani stanu live
DB**. Przetestuj migrację na odtworzonej kopii. Na produkcji używaj wyłącznie:

```bash
npm run db:generate
npm run db:migrate:deploy
```

Nie używaj `prisma db push`, `prisma migrate reset`, `--force-reset` ani ręcznych
zmian schematu. `npm run db:seed` nie jest krokiem rutynowego deployu. Można go
rozważyć tylko przy świadomym bootstrapie pustej bazy, po przejrzeniu skryptu i
osobnej zgodzie operatora.

## 6. Instalacja, kontrola i build

Aktywuj środowisko Node.js 24 wskazane przez DirectAdmin, a następnie:

```bash
cd /home/USER/CraftRoni
npm ci --ignore-scripts --include=dev
npm run db:generate
npm audit --omit=dev
npm audit --json
npm run test
npx tsc --noEmit
npm run lint
NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 npm run build
test -s .next/BUILD_ID && echo "BUILD OK"
```

`npm ci --ignore-scripts` ma odtworzyć dokładnie `package-lock.json` bez uruchamiania
skryptów lifecycle zależności; wymagane `prisma generate` wykonujemy jawnie. Nie
akceptuj lokalnego `node_modules` jako dowodu. Lokalny snapshot z 2026-08-18 wykonał czyste
`npm ci --ignore-scripts`, jawne `prisma generate`, oba warianty audytu, 33 testy,
typecheck, lint i build Next.js 16.3.1 na Node 24.18.0. Wszystkie kontrole przeszły,
a `.next/BUILD_ID` powstał. Build używał fikcyjnego, niedostępnego URL bazy, dlatego
potwierdza artefakt, ale nie połączenie ani dane SEOHOST. Workflow w `.github`
powtarza ten zestaw; pierwsze zdalne uruchomienie nadal wymaga potwierdzenia.

Projekt wymusza Webpack i ogranicza liczbę workerów dla hostingu współdzielonego.
Nie uruchamiaj globalnego `next build`. Po udanym buildzie sprawdź `.next/BUILD_ID`,
a następnie zrestartuj aplikację w panelu Node.js/Passenger.

## 7. Cron rezerwacji magazynu

Wygaszanie `PENDING` jest częścią spójności magazynu, nie opcjonalnym zadaniem
porządkowym. Płatność Autopay jest ważna 30 minut, następnie obowiązuje 15 minut
grace na opóźniony ITN; stock jest zwalniany po 45 minutach. W DirectAdmin
skonfiguruj zadanie co 5 minut, uruchamiane w katalogu aplikacji i w tym samym
środowisku Node.js 24:

```cron
*/5 * * * * cd /home/USER/CraftRoni && npm run orders:expire
```

Jeśli DirectAdmin wymaga aktywacji `nodevenv`, użyj dokładnej komendy pokazanej
przez panel przed `npm run orders:expire`. Nie wpisuj sekretów do crontaba. Zapisuj
kod zakończenia i alertuj brak uruchomień/błędy, ale nie loguj danych klientów.

Po konfiguracji utwórz kontrolowane zamówienie w środowisku testowym, pozwól mu
wygasnąć i potwierdź dokładnie jeden zwrot stanu oraz wpis w historii statusów.

## 8. Autopay i SMTP

Sandbox uruchamiaj w osobnym środowisku z `APP_ENV=staging`, osobną bazą i
`AUTOPAY_SANDBOX=true`. Publiczny adres ITN ma wskazywać dokładnie:

```text
https://STAGING-DOMENA/api/payments/autopay/itn
```

Wykonaj i udokumentuj co najmniej:

- sukces płatności i pojedynczą zmianę `PENDING` → `PAID`,
- odrzucenie i porzucenie płatności,
- sekwencyjne i równoległe ponowienie tego samego ITN,
- płatność po wygaśnięciu/anulowaniu — bez automatycznego naruszenia stocku,
  z flagą ręcznego uzgodnienia,
- zgodność kwoty/waluty oraz brak zmiany statusu po niezgodnym komunikacie,
- link „Dokończ płatność”: token HMAC wyprowadzony z zapisanego `checkoutKeyHash`
  → cookie `HttpOnly` → URL bez sekretu; baza nie zapisuje tokenu ani jego hasha;
  sprawdź wznowienie z e-maila, odrzucenie obcego tokenu i rotację sekretu,
- osobny przypadek uzgodnienia dla każdego `RemoteID`: akceptacja płatności
  (`PAYMENT_ACCEPTED`) i potwierdzenie zwrotu (`REFUND_CONFIRMED`) wymagają
  referencji, audytu, CAS i właściwej rezerwacji albo zwolnienia stocku;
  `NO_PAYMENT_FOUND` wyłącznie dla legacy `PENDING` bez płatności,
- dostarczenie właściwych e-maili bez duplikacji.

Powrót przeglądarki nie jest dowodem płatności; status potwierdza ITN. Zwroty są
wykonywane ręcznie w portalu Autopay, a panel służy do audytowanego zapisania
`REFUND_CONFIRMED` z referencją dla konkretnego `RemoteID`.

Kod formatuje `ValidityTime` i interpretuje `paymentDate` literalnie jako stałe
**CET = UTC+1**, także latem. Nie zweryfikowano, czy operator oczekuje stałego CET,
czy cywilnego CET/CEST. Przed release wykonaj letni sandbox E2E i uzyskaj od
Autopay pisemne potwierdzenie; bez obu dowodów `CHECKOUT_ENABLED` pozostaje `false`.

Brak danych konta SMTP. Właściciel deklaruje istniejące TLS oraz SPF, DKIM i DMARC,
ale wymagają one odczytu i testu. SMTP wymaga osobnego konta lub hasła aplikacji,
wymuszonego TLS i poprawnego certyfikatu. Kompletna
konfiguracja jest warunkiem rejestracji: endpoint ma zwracać neutralną odpowiedź,
nie przyjmować hasła, nazwy ani zgody przed dowodem własności adresu, nie wykonywać
auto-loginu i wysłać 24-godzinny link. Klient dopiero po jego otwarciu ustawia
hasło, podaje nazwę i akceptuje regulamin; baza zapisuje czas i wersję zgody.
Przetestuj rejestrację istniejącego/nowego adresu, kilka nadal ważnych linków,
wygaśnięcie, replay, logowanie dopiero po aktywacji oraz wiadomości zamówienia,
płatności, wysyłki i resetu. Dostawa live pozostaje niezweryfikowana.

Dopiero po zaliczeniu sandbox E2E, ustawieniu produkcyjnych danych Autopay,
sprawdzeniu SMTP/monitoringu/backupu i formalnej akceptacji właściciel może zmienić
`CHECKOUT_ENABLED=true` i zrestartować aplikację. Zapisz kto, kiedy i dla jakiego
commita podjął tę decyzję.

## 9. Pierwszy administrator

Pierwsze konto utwórz po zabezpieczeniu Access. Tymczasowo dodaj do chronionego
`.env`:

```env
ADMIN_EMAIL="twoj-adres@example.com"
ADMIN_NAME="Administrator"
ADMIN_PASSWORD="UNIKALNE_HASLO_MINIMUM_12_ZNAKOW"
```

Następnie:

```bash
npm run admin:create
```

Po poprawnym wyniku usuń `ADMIN_PASSWORD`; pozostałe zmienne bootstrapowe również
nie są potrzebne runtime. Nie podawaj hasła jako argumentu polecenia. Skrypt nie
podnosi automatycznie roli istniejącego klienta. Zaloguj się przez Access i panel,
potwierdź rolę oraz wylogowanie. MFA/awaryjny dostęp pozostają **TBD**.

## 10. Odbiór i aktualizacje

Po każdym wdrożeniu wykonaj z zewnętrznej sieci i zapisz wynik:

- właściwa wersja Node.js i obecność `.next/BUILD_ID`,
- HTTPS, certyfikat origin, HSTS i wymagane nagłówki,
- Access na wszystkich trasach poza dokładnym ITN,
- brak cache dla API, panelu, konta i odpowiedzi sesyjnych,
- sklep, logowanie, panel, zapis ustawień i upload na trwały wolumen,
- cron wygaszania i alert na jego błąd,
- SMTP oraz Autopay dopiero po dostępności danych,
- logi 5xx, błędy bazy, miejsce na dysku i wynik backupu.

Przy rutynowej aktualizacji kolejność jest następująca:

1. przypnij commit i utrzymaj `CHECKOUT_ENABLED=false` podczas zmian wysokiego ryzyka;
2. wykonaj kopię i udany test odtworzenia;
3. wykonaj `npm ci --ignore-scripts --include=dev` oraz wszystkie kontrole z sekcji 6;
4. zastosuj przetestowane migracje;
5. zbuduj, potwierdź `.next/BUILD_ID` i zrestartuj Passenger;
6. wykonaj smoke test i obserwuj logi;
7. nie uruchamiaj rutynowo seeda;
8. przywróć checkout tylko po spełnieniu jego osobnej bramki akceptacyjnej.

## 11. Checklista przed publicznym startem

- [ ] Wdrażany commit, wyniki kontroli i osoby akceptujące są zapisane.
- [ ] Produkcja działa na Node.js 24; dokładna wersja jest potwierdzona z serwera.
- [ ] `APP_ENV=production`, a `CHECKOUT_ENABLED=false` do końcowej decyzji.
- [ ] Sekrety dev/staging/production są odrębne; `.env` ma minimalne ACL; skan
      sekretów obejmuje drzewo, historię i artefakty.
- [ ] `AUTH_SECRET` i `PAYMENT_ACCESS_SECRET` mają po co najmniej 32 losowe bajty,
      różne wartości i udokumentowane skutki rotacji.
- [ ] Oba audyty po czystym `npm ci --ignore-scripts` mają wynik 0 albo każdy wyjątek ma analizę
      reachability, właściciela i formalną decyzję release.
- [ ] Kopia bazy i uploadów została odtworzona przed migracją; RPO/RTO zaakceptowano.
- [ ] Migracje przetestowano na odtworzonej kopii; seed nie jest częścią deployu.
- [ ] Test migracji potwierdza `RESTRICT` dla transakcji, przypadków uzgodnienia
      i zdarzeń statusu;
      wykonanie migracji na live DB ma osobny dowód.
- [ ] Przed migracją zapisano odczytowy raport historycznych zamówień według
      `status × paymentMethod × paidAt × paymentId` i uzgodniono pochodzenie oraz
      sposób obsługi wszystkich legacy `PENDING`/anulowanych płatnych rekordów.
- [ ] `npm ci --ignore-scripts`, jawne generowanie Prisma, test, typecheck, lint,
      build i `.next/BUILD_ID` przeszły dla commita.
- [ ] Cały host jest za Access; tylko `/api/payments/autopay/itn` ma dokładny
      publiczny wyjątek bez challenge; proxy ma limit body ok. 256 KiB.
- [ ] Origin przyjmuje ruch tylko z Cloudflare; cache i `CF-Connecting-IP`
      sprawdzono na żywo.
- [ ] Cron `npm run orders:expire` działa co 5 minut i ma monitoring błędów.
- [ ] Trwały wolumen uploadów, pojemność i prawa procesu sprawdzono.
- [ ] Autopay (**TBD**) przeszedł pełny sandbox E2E na publicznym ITN.
- [ ] Letni sandbox E2E i pisemne stanowisko Autopay rozstrzygają CET/CEST dla
      `ValidityTime` i `paymentDate`; bieżący kod używa literalnego CET (UTC+1).
- [ ] Wznowienie płatności z e-maila używa `PAYMENT_ACCESS_SECRET`, a przypadki
      per `RemoteID` i decyzje `PAYMENT_ACCEPTED`/`REFUND_CONFIRMED` przeszły testy
      pozytywne, negatywne i współbieżności; `NO_PAYMENT_FOUND` działa tylko dla
      legacy.
- [ ] SMTP (**obecnie brak danych konta**) przeszedł test TLS, SPF/DKIM/DMARC
      i dostarczalności.
- [ ] Rejestracja nie przyjmuje hasła przed potwierdzeniem adresu, nie wykonuje
      auto-loginu ani enumeracji, wymaga kompletnego SMTP, a ustawienie hasła przez
      24-godzinny link, ponowienie/replay i dostawa live zostały zweryfikowane.
- [ ] MFA administratora i konto awaryjne (**TBD**) zostały uzgodnione i sprawdzone.
- [ ] Strony prawne, retencja danych i obsługa praw klientów są zatwierdzone.
- [ ] Monitoring, alerty, kontakt incydentowy i procedura zwrotów są gotowe.
- [ ] Właściciel jawnie zaakceptował zmianę `CHECKOUT_ENABLED=true`.

Szczegóły ryzyk i procedury utrzymania: [SECURITY_OPERATIONS.md](SECURITY_OPERATIONS.md).
