# 🎨 CraftRoni — craft.roni · polskie rękodzieło

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1)

> Sklep internetowy z ręcznie szytym rękodziełem: portfeliki, nerki i giga nerki.

> **Zakres dokumentu (2026-08-18):** jedyną obsługiwaną bramką płatniczą jest
> Autopay. W bieżącym drzewie nie utrzymujemy alternatywnej integracji płatniczej.
> Integracja Autopay wymaga jeszcze pełnego testu sandbox E2E.

## 📋 Spis treści

- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Szybki start (dev)](#-szybki-start-dev)
- [Zmienne środowiskowe](#-zmienne-środowiskowe)
- [Panel administracyjny](#-panel-administracyjny)
- [Płatności (Autopay)](#-płatności-autopay)
- [E-maile (SMTP)](#-e-maile-smtp)
- [Wdrożenie produkcyjne (SEOHOST)](#-wdrożenie-produkcyjne-seohost)
- [Struktura projektu](#-struktura-projektu)
- [Bezpieczeństwo](#-bezpieczeństwo)
- [Status weryfikacji](#-status-weryfikacji)
- [Roadmap](#-roadmap)
- [UI Style Guide](docs/UI_STYLE_GUIDE.md) — paleta, typografia, komponenty, znaki marki
- [Deployment](docs/DEPLOYMENT.md) — kolejność bezpiecznego wdrożenia na SEOHOST
- [Security & Operations](docs/SECURITY_OPERATIONS.md) — wymagania produkcyjne, kopie zapasowe, incydenty i otwarte ryzyka

## 🎯 Funkcjonalności

**Sklep (klient):**
- ✅ Katalog produktów: filtrowanie po kategorii i cenie, sortowanie, paginacja, wyszukiwarka
- ✅ Strona produktu z galerią zdjęć i produktami powiązanymi
- ✅ Koszyk (localStorage) z progiem darmowej dostawy sterowanym z panelu
- ✅ Opcjonalny banner darmowej dostawy — włączany i wyłączany w panelu
- ✅ Formularz kontaktowy wysyłany przez Formspree z komunikatem o wyniku
- ✅ Checkout gościnny (konto niewymagane) z akceptacją regulaminu
- ✅ Konta klientów: rejestracja z neutralną odpowiedzią i bez automatycznego
  logowania, 24-godzinny link do potwierdzenia e-maila i ustawienia hasła,
  logowanie dopiero po aktywacji, reset hasła i historia zamówień (`/konto`);
  checkout gościnny pozostaje niezależny od konta
- 🟡 Kod płatności Autopay (podpisany paywall, powrót i ITN) — po skonfigurowaniu
  danych; pełny test sandbox E2E nie został jeszcze wykonany
- ✅ Bezpieczne wznowienie płatności z linku e-mail: osobny token HMAC jest
  przenoszony do krótkiego cookie `HttpOnly`, a sekret znika z paska adresu
- ✅ E-maile transakcyjne i reset hasła — po skonfigurowaniu SMTP; błąd wysyłki
  nie cofa utworzonego zamówienia ani zmiany statusu
- ✅ Strony prawne: regulamin, polityka prywatności, zwroty, dostawa *(szablony — patrz [Przed startem](#przed-startem-produkcyjnym))*
- ✅ SEO: metadata, sitemap.xml, robots.txt; własne strony 404/błędu

**Panel administracyjny (`/admin`):**
- ✅ Dashboard ze statystykami z bazy (produkty, zamówienia, przychód)
- ✅ CRUD produktów z **uploadem zdjęć** (kolejność, zdjęcie główne)
- ✅ CRUD kategorii z **uploadem zdjęcia kategorii**
- ✅ Zamówienia: lista z filtrami, zmiana statusu, notatki z historią oraz
  audytowane rozstrzygnięcie alertu płatniczego z referencją i kontrolą magazynu
- ✅ Ustawienia sklepu zapisywane w bazie (nazwa, kontakt, koszty dostawy, widoczność bannera)
- ✅ Zmiana hasła administratora
- ✅ Wersja mobilna panelu

**Magazyn:** stany są rezerwowane przy zamówieniu przez atomowy decrement, zwracane
tylko raz przy anulowaniu lub wygaśnięciu; edycja produktu używa wersji stanu, aby
nie nadpisać równoległego checkoutu. Płatność Autopay jest ważna 30 minut, po czym
ITN ma jeszcze 15 minut grace; rezerwacja `PENDING` i stock są zwalniane po 45 minutach.
Na produkcji wymagany jest cron `npm run orders:expire` uruchamiany co 5 minut.
Produkt z historią zamówień jest archiwizowany, nie usuwany.

## 🛠 Technologie

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 16 (App Router, React 19) |
| Język | TypeScript 5 |
| Stylowanie | Tailwind CSS 4 |
| ORM | Prisma 6 |
| Baza danych | MySQL / MariaDB |
| Walidacja | zod |
| Autoryzacja | JWT (jose) + sesje w bazie, bcryptjs |
| Płatności | Autopay (paywall + ITN) |
| E-mail | nodemailer (SMTP) |
| Ikony | Lucide React |

## 🚀 Szybki start (dev)

Projekt wymaga Node.js **>=22**. Lokalnie można używać wspieranej linii LTS,
natomiast docelowa produkcja CraftRoni wymaga **Node.js 24** —
[Node 20 jest EOL od 2026-03-24](https://nodejs.org/en/about/previous-releases).
Potrzebne są też npm oraz MySQL/MariaDB. Projekt ma `package-lock.json`, dlatego
do powtarzalnej instalacji używamy `npm ci --ignore-scripts`, a wymagane generowanie
Prisma uruchamiamy jawnie.

```bash
git clone https://github.com/toniii98/CraftRoni.git
cd CraftRoni
npm ci --ignore-scripts
cp .env.example .env
# uzupełnij DATABASE_URL, AUTH_SECRET i osobny PAYMENT_ACCESS_SECRET
# oba sekrety wygeneruj niezależnie, np. openssl rand -base64 32

npm run db:generate   # klient Prisma
npm run db:migrate:deploy # zastosowanie wersjonowanych migracji
npm run db:seed       # opcjonalny bootstrap pustej bazy deweloperskiej
# ustaw ADMIN_EMAIL i ADMIN_PASSWORD (min. 12 znaków) w .env
npm run admin:create  # pierwsze konto administratora
npm run dev           # http://localhost:3000
```

W PowerShell odpowiednikiem kopiowania jest `Copy-Item .env.example .env`.
Nie otwieraj aplikacji na publicznym interfejsie z deweloperskimi danymi logowania.

Baza (MySQL/MariaDB):
```sql
CREATE DATABASE craftroni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Przydatne skrypty: `npm run db:studio` (podgląd bazy),
`npm run db:migrate:deploy` (migracje na serwerze), `npm test`, `npm run lint`
i `npm run build`. W repozytorium nie ma komendy resetującej bazę, aby nie dało
się przypadkowo skasować danych produkcyjnych.

## ⚙️ Zmienne środowiskowe

Pełna lista z opisami znajduje się w [.env.example](.env.example). Plik `.env`
jest ignorowany przez Git. Deweloperskie i produkcyjne wartości muszą być
utrzymywane osobno; nie kopiuj gotowego `.env` między środowiskami i nie używaj
ponownie tych samych sekretów.

| Zmienna | Wymagana | Zakres i zasady |
|---------|----------|-----------------|
| `DATABASE_URL` | ✅ runtime | Łańcuch MySQL/MariaDB, np. `mysql://user:pass@host:3306/craftroni`; produkcyjny użytkownik powinien mieć tylko uprawnienia potrzebne aplikacji |
| `AUTH_SECRET` | ✅ runtime | Losowy sekret podpisywania sesji — **bez niego aplikacja nie wystartuje**; osobny dla każdego środowiska, minimum 32 losowe bajty |
| `PAYMENT_ACCESS_SECRET` | ✅ runtime produkcyjny | Niezależny sekret HMAC tokenów wznowienia płatności, minimum 32 losowe bajty; nie wolno używać wartości `AUTH_SECRET`. Pozostaje wymagany także przy czasowo wyłączonym checkoutcie, aby istniejące trasy nie kończyły się błędem konfiguracji |
| `NEXT_PUBLIC_APP_URL` | ✅ produkcja | Dokładny publiczny origin HTTPS sklepu, bez ścieżki; służy m.in. do kontroli originu, linków resetu i powrotu z Autopay, więc nie jest sekretem |
| `APP_ENV` | ✅ produkcja | Ustaw jawnie `production`; oddziela reguły bezpieczeństwa aplikacji od technicznego `NODE_ENV` |
| `CHECKOUT_ENABLED` | ✅ produkcja | Pozostaw `false` do pełnej konfiguracji i udokumentowanego sandbox E2E; dopiero świadoma aktywacja na `true` otwiera checkout |
| `NODE_ENV` | automatyczna | `next dev` używa development, build/start — production; nie przenoś wartości `development` z przykładu na serwer |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | tylko `admin:create` | Tymczasowe dane pierwszego administratora; po wykonaniu komendy usuń hasło z `.env` |
| `AUTOPAY_SERVICE_ID`, `AUTOPAY_SHARED_KEY` | przy Autopay | Puste = płatności online wyłączone; dane sandbox i produkcyjne muszą być odrębne |
| `AUTOPAY_HASH_ALGORITHM`, `AUTOPAY_SANDBOX` | przy Autopay | Algorytm uzgodniony z operatorem; najpierw `AUTOPAY_SANDBOX=true` i pełny test E2E |
| `AUTOPAY_GATEWAY_URL` | opcjonalna | Zwykle pusta; niestandardowy adres musi być HTTPS i wskazywać dozwolony host odpowiedniego środowiska |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | przy e-mailach i rejestracji | Kompletna konfiguracja jest warunkiem rejestracji konta i wysyłki linku potwierdzającego; `SMTP_USER`/`SMTP_PASSWORD` są danymi uwierzytelniającymi, jeśli serwer ich wymaga |

Sekretów nie dodajemy do zmiennych z prefiksem `NEXT_PUBLIC_`, panelu admina,
bazy `settings`, logów ani repozytorium. Po przypadkowym ujawnieniu sekret należy
unieważnić/obrócić, nie tylko usunąć z pliku.

## 🔑 Panel administracyjny

- Adres: `/admin` (logowanie: `/admin/login`)
- Seed nie tworzy administratora i nie istnieje domyślne hasło.
- Ustaw `ADMIN_EMAIL`, opcjonalnie `ADMIN_NAME` i `ADMIN_PASSWORD` (min. 12 znaków)
  w chronionym `.env`, uruchom `npm run admin:create`, a potem usuń z `.env`
  zmienną `ADMIN_PASSWORD`.
- Ponowne uruchomienie komendy dla istniejącego administratora ustawia nowe hasło
  i wylogowuje jego wcześniejsze sesje. Komenda nie podnosi automatycznie uprawnień
  istniejącego konta klienta.
- Hasło zmienisz w panelu: Ustawienia → Konto
- Pełna instrukcja serwerowa: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Panel i jego API sprawdzają rolę administratora oraz obecność sesji w bazie.
Na produkcji `/admin` ma zostać dodatkowo ograniczony przez Cloudflare Zero Trust;
MFA po stronie samej aplikacji nie jest jeszcze zaimplementowane.

## 💳 Płatności (Autopay)

> **Status:** kod integracji i testy jednostkowe są obecne, ale konfiguracja Autopay
> pozostaje **TBD**, a pełna płatność sandbox z publicznym ITN nie została potwierdzona.
> Produkcyjny checkout pozostaje wyłączony. Powrót przeglądarki nie jest dowodem
> zapłaty — źródłem statusu jest ITN.

1. Załóż konto w [portalu Autopay](https://portal.autopay.eu) i poproś o dane
   środowiska testowego, jeśli nie zostały udostępnione automatycznie.
2. Z sekcji konfiguracji technicznej przepisz do `.env` identyfikator serwisu i
   klucz konfiguracji (hash):
   ```env
   AUTOPAY_SERVICE_ID=""
   AUTOPAY_SHARED_KEY=""
   AUTOPAY_HASH_ALGORITHM="sha256"
   AUTOPAY_SANDBOX="true"
   ```
   Dane testowe i produkcyjne są różne. Algorytm hasha musi być taki sam po obu
   stronach; domyślnie Autopay używa SHA-256.
3. W konfiguracji dedykowanego sklepu ustaw:
   - adres powrotu: `https://TWOJA-DOMENA/zamowienie/potwierdzenie`
   - adres ITN: `https://TWOJA-DOMENA/api/payments/autopay/itn`
4. Adres ITN musi być publicznie dostępny po HTTPS z pełnym łańcuchem certyfikatu
   i obsługiwać TLS 1.2 lub 1.3. Localhost nie odbierze komunikatu Autopay.
   W okresie odbioru Cloudflare Access chroni całą aplikację z jednym dokładnym
   wyjątkiem: `/api/payments/autopay/itn`. Ta ścieżka nie może otrzymywać
   interaktywnego challenge; wyjątek nie może obejmować prefiksu `/api/payments/*`
   ani innych tras. Kod przyjmuje body ITN do 192 KiB; na proxy ustaw ok. 256 KiB.

Przepływ: zamówienie → wewnętrzna strona przekierowania → podpisany formularz
POST do paywallu Autopay → ITN `Base64(XML)` → weryfikacja service ID, SHA-256,
kwoty, waluty i zamówienia → idempotentny status `PAID` + e-mail do klienta.
Powrót przeglądarki nie oznacza zapłaty; jedynym źródłem potwierdzenia jest ITN.

Link „Dokończ płatność” w e-mailu używa osobnego, serwerowo wyprowadzonego tokenu
HMAC podpisanego przez `PAYMENT_ACCESS_SECRET` — nie surowego klucza idempotencji
checkoutu ani `AUTH_SECRET`. Baza przechowuje `checkoutKeyHash`, z którego serwer
wyprowadza token; nie zapisuje samego tokenu ani jego hasha. Rotacja sekretu
unieważnia wcześniejsze linki, a kontrolowane ponowienie checkoutu może wydać link
podpisany bieżącym sekretem.
Trasa startowa weryfikuje token, ustawia krótkie cookie `HttpOnly`, `SameSite=Lax`
(`Secure` w produkcji), po czym przekierowuje na adres bez sekretu w query.

Integracja zakłada model prowizji sprzedawcy, w którym klient płaci dokładnie
kwotę zamówienia. Bez kompletnej konfiguracji Autopay lub przy
`CHECKOUT_ENABLED=false` API nie utworzy zamówienia. Zwroty wykonuje się obecnie
w portalu Autopay.

`ValidityTime` wysyłany do Autopay i `paymentDate` w ITN są interpretowane
literalnie jako **CET = UTC+1**, również w okresie polskiego czasu letniego. Przed
produkcją wykonaj sandbox E2E latem i uzyskaj od Autopay pisemne potwierdzenie,
czy protokół oczekuje stałego CET, czy cywilnego CET/CEST. To bramka release.

Migracja bezpieczeństwa tworzy ręczne sprawy uzgodnienia także dla historycznych
zamówień `PENDING` oraz anulowanych z zapisaną płatnością. Przed wdrożeniem wykonaj
na produkcji wyłącznie odczytowy raport `status × paymentMethod × paidAt × paymentId`
i ustal pochodzenie każdego rekordu; migracja nie może automatycznie przypisać
starych płatności do Autopay. Najpierw przećwicz ją na odtworzonej kopii bazy.

W sandboxie sprawdź co najmniej: płatność poprawną, odrzuconą, porzuconą,
ponowienie identycznego ITN, wznowienie z linku e-mail oraz oba rozstrzygnięcia
alertu w panelu. Potwierdź, że tylko pierwszy poprawny `SUCCESS` zmienia zamówienie
i wysyła e-mail.

## ✉️ E-maile (SMTP)

Sklep wysyła: 24-godzinny link potwierdzenia e-maila i ustawienia hasła, potwierdzenie zamówienia
(klient), powiadomienie o nowym zamówieniu (na `store_email` z ustawień panelu),
potwierdzenie płatności, informację o wysyłce oraz link resetu hasła. Rejestracja
wymaga kompletnej konfiguracji SMTP, nie loguje automatycznie i nie ujawnia, czy
adres już istnieje. Danych konta SMTP nadal brak. Właściciel deklaruje istniejące
TLS oraz rekordy SPF/DKIM/DMARC, ale nie wykonano ich uwierzytelnionego odczytu ani
testu dostarczenia.

Konfiguracja dla Google Workspace (zalecane: hasło aplikacji):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="sklep@twojadomena.pl"
SMTP_PASSWORD="haslo-aplikacji"    # Google: Konto → Bezpieczeństwo → Hasła aplikacji (wymaga 2FA)
SMTP_FROM="CraftRoni <sklep@twojadomena.pl>"
```

Przed produkcją zweryfikuj wysyłkę i odbiór na prawdziwe skrzynki, ustaw SPF,
DKIM i DMARC dla domeny nadawcy oraz upewnij się, że `NEXT_PUBLIC_APP_URL`
w linkach resetu wskazuje właściwy origin HTTPS. Haseł aplikacji nie zapisuj
w dokumentacji ani logach.

## 🌍 Wdrożenie produkcyjne (SEOHOST)

Docelowe środowisko to współdzielony hosting SEOHOST z DirectAdmin/Passenger,
Node.js 24, MySQL/MariaDB i Cloudflare przed domeną. Repozytorium zawiera
wersjonowane migracje Prisma oraz konfigurację buildu ograniczającą liczbę workerów
pod limity SEOHOST. Szczegóły środowiska muszą być potwierdzane odczytem z serwera.

Pełna, kolejna instrukcja jest w [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
W `.env` ustaw jawnie `APP_ENV=production` i pozostaw
`CHECKOUT_ENABLED=false`. Dopiero po wykonaniu i sprawdzeniu kopii oraz próbnego
odtworzenia wolno zastosować migracje. Minimalny zestaw komend w oknie wdrożeniowym:

```bash
npm ci --ignore-scripts --include=dev
npm run db:generate
npm run db:migrate:deploy
npm run test && npm run lint && npm run build
```

- Nie używaj `prisma db push`, `prisma migrate reset` ani `--force-reset` na
  produkcji. `npm run db:seed` nie jest krokiem rutynowego deployu.
- Skonfiguruj cron `npm run orders:expire` co 5 minut i monitoruj jego błędy.
- Uruchamiaj Node jako nieuprzywilejowany użytkownik; port aplikacji wystawiaj
  tylko do reverse proxy. Baza nie powinna być publicznie dostępna.
- Reverse proxy (nginx/caddy) → `localhost:3000`; musi przekazywać właściwy
  `Host`. Origin musi przyjmować ruch wyłącznie z Cloudflare, ponieważ aplikacja
  używa `CF-Connecting-IP` do rate limitingu i odrzuca wielowartościowy adres.
- Za Cloudflare: SSL/TLS **Full (strict)**, origin dostępny tylko oczekiwaną drogą;
  nie cache'ować `/api/*`, `/admin*` ani odpowiedzi zależnych od sesji.
- HSTS obejmuje subdomeny — włącz produkcję dopiero, gdy wszystkie objęte nazwy
  działają poprawnie po HTTPS.
- Zdjęcia produktów i kategorii trafiają odpowiednio do
  `public/uploads/products` i `public/uploads/categories`; oba katalogi muszą
  przetrwać deploy (wolumen) i być objęte kopią zapasową.
- Backup to spójny dump bazy **razem z uploadami**, szyfrowany, przechowywany
  poza VPS i regularnie sprawdzany przez próbne odtworzenie.
- Po deployu wykonaj niezależny smoke test z zewnątrz oraz sprawdź logi i alerty.
  Sam udany `npm run build` nie potwierdza poprawności środowiska produkcyjnego.

Pełna checklista, model danych wrażliwych, otwarte ryzyka i procedura incydentu:
[docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md).

### Przed startem produkcyjnym

- [ ] Uzupełnić `[UZUPEŁNIJ]` w `src/app/(shop)/{regulamin,prywatnosc}`
      (dane firmy, NIP, adres) oraz zatwierdzić realne zasady w stronach zwrotów
      i dostawy; usunąć ostrzeżenie szablonu dopiero po pełnym przeglądzie
- [ ] Uzgodnić retencję danych klientów/zamówień, podstawy prawne, realizację praw osób oraz kontakt bezpieczeństwa
- [ ] Ustawić `APP_ENV=production`, niezależne produkcyjne `AUTH_SECRET` i
      `PAYMENT_ACCESS_SECRET` oraz pozostawić `CHECKOUT_ENABLED=false`
- [ ] Skonfigurować brakujące SMTP i Autopay (**dane Autopay nadal TBD**),
      zaczynając od osobnego środowiska; nie kopiować sekretów
- [ ] Przed migracją wykonać kopię bazy i uploadów oraz udokumentowaną próbę
      odtworzenia; dopiero potem przetestować i wdrożyć migracje Prisma
- [ ] Skonfigurować trwały wolumen uploadów, szyfrowane backupy off-host i udokumentować udany test odtworzenia
- [ ] Zweryfikować ustawienia SEOHOST/Passenger i Cloudflare: całość za Access,
      dokładny publiczny wyjątek tylko dla `/api/payments/autopay/itn`, brak
      interaktywnego challenge na tej trasie i limit body ok. 256 KiB
- [ ] Ograniczyć panel przez Cloudflare Zero Trust; wymaganie MFA administratora
      i procedura konta awaryjnego są nadal **TBD**
- [ ] Skonfigurować i sprawdzić cron `npm run orders:expire` co 5 minut
- [ ] Zweryfikować SMTP, SPF/DKIM/DMARC, neutralną rejestrację bez auto-loginu,
      24-godzinny link weryfikacyjny, dostawę live i cały reset hasła
- [ ] Wykonać pełny Autopay sandbox E2E: sukces, odrzucenie, porzucenie, retry ITN i późna płatność po anulowaniu
- [ ] Wykonać sandbox E2E w okresie letnim i uzyskać od Autopay pisemne
      potwierdzenie, że `ValidityTime` i `paymentDate` oznaczają stałe CET (UTC+1)
- [ ] Dodać prawdziwe produkty i zdjęcia przez panel
- [ ] Zaktualizować e-mail/Instagram w `src/lib/config.ts`; telefon, e-mail sklepu
      i parametry dostawy zweryfikować osobno w ustawieniach bazy/panelu
- [ ] Uruchomić `npm ci --ignore-scripts --include=dev`, jawne `npm run db:generate`,
      oba audyty, test, typecheck, lint i build; zapisać wyniki dla wdrażanego commita
- [ ] Uruchamiać produkcję na Node.js 24; zapisać dokładną wersję w dowodzie wdrożenia

## 📁 Struktura projektu

```
CraftRoni/
├── assets/                     # Źródłowe pliki identyfikacji wizualnej
├── docs/
│   ├── UI_STYLE_GUIDE.md       # Źródło zasad wizualnych marki
│   ├── DEPLOYMENT.md           # Runbook wdrożenia SEOHOST/Passenger
│   └── SECURITY_OPERATIONS.md  # Runbook i checklista bezpieczeństwa
├── prisma/
│   ├── schema.prisma           # Schemat bazy
│   ├── migrations/             # Migracje wdrażane przez prisma migrate deploy
│   ├── create-admin.ts         # Bezpieczne tworzenie/reset hasła administratora
│   ├── expire-orders.ts        # Wygaszanie rezerwacji PENDING (cron co 5 minut)
│   └── seed.ts                 # Bazowe kategorie i ustawienia; bez kasowania danych
├── public/
│   ├── brand/                  # Wygenerowane znaki marki (emblem, wordmark)
│   └── uploads/                # Zdjęcia produktów i kategorii; poza git
├── src/
│   ├── app/
│   │   ├── (shop)/             # Sklep: strona główna, sklep, produkt, koszyk,
│   │   │                       #   zamówienie, konto klienta, strony prawne
│   │   ├── (admin)/admin/
│   │   │   ├── login/          # Logowanie (bez sidebara)
│   │   │   └── (panel)/        # Panel chroniony sesją: dashboard, produkty,
│   │   │                       #   kategorie, zamówienia, ustawienia
│   │   ├── api/
│   │   │   ├── auth/           # login/logout, rejestracja + weryfikacja e-mail, reset hasła
│   │   │   ├── orders/         # składanie zamówień (checkout gościnny lub konto)
│   │   │   ├── payments/autopay/ # podpisany komunikat ITN Autopay
│   │   │   └── admin/          # CRUD + upload + ustawienia + hasło (requireAdmin)
│   │   ├── sitemap.ts, robots.ts, error.tsx, not-found.tsx
│   ├── components/             # layout/ ui/ shop/ admin/
│   ├── context/CartContext.tsx # Koszyk (localStorage)
│   ├── lib/                    # auth, prisma, settings, email, autopay, uploads,
│   │                           #   validation (zod), rate-limit, utils, config
│   └── proxy.ts                # Wstępna ochrona tras /admin (podpis JWT + rola)
└── .env.example
```

## 🔒 Bezpieczeństwo

Kontrole potwierdzone w bieżącym kodzie (nie są dowodem konfiguracji hosta):

- `AUTH_SECRET` jest wymagany i nie ma fallbacku; sesja to podpisany JWT w cookie
  `httpOnly`, `sameSite=lax` (`secure` w produkcji), ważny 7 dni
- w bazie przechowywany jest SHA-256 tokenu sesji, a strony panelu i API
  sprawdzają jej istnienie oraz rolę; wylogowanie/unieważnienie działa natychmiast
- hasła są hashowane bcrypt (cost 12, minimum 8 znaków, maksimum 72 bajty UTF-8);
  token resetu jest losowy, w bazie zahashowany i ważny godzinę, a jego zużycie,
  zmiana hasła oraz unieważnienie sesji są atomowe
- rejestracja nie przyjmuje ani nie ustawia hasła przed dowodem własności adresu,
  nie tworzy sesji i nie ujawnia istnienia konta; klient ustawia hasło dopiero po
  otwarciu zahashowanego linku aktywacyjnego ważnego 24 godziny, podaje nazwę i
  akceptuje regulamin; konto zapisuje czas oraz wersję zgody. Ponowne zgłoszenie nie
  unieważnia wcześniej wysłanego, nadal ważnego linku
- Zod waliduje zamówienia, rejestrację/reset i zapisy admina; logowanie i webhook
  mają osobne kontrole typu/wymaganych pól
- checkout można globalnie zamknąć; wymaga kompletnej konfiguracji Autopay,
  klucza idempotencji i limituje zagregowaną ilość; płatność jest ważna 30 minut,
  ITN ma 15 minut grace, stock pozostaje zarezerwowany łącznie przez 45 minut,
  a kwota zamówienia nie może przekroczyć 75 000 PLN (limit wspólny podstawowych
  kanałów PBL/karta/fast transfer/BLIK; kanały odroczone mają własne niższe limity)
- ceny, dostawa i stan są liczone po stronie serwera; wersje zamówienia/stocku,
  warunkowe zapisy i log statusów chronią główne wyścigi anulowania, ITN i edycji
- wygasłe rezerwacje są zwalniane atomowo przez `orders:expire`; cron pozostaje
  obowiązkiem operacyjnym. Checkout gościnny pozostaje dostępny
- upload wymaga sesji admina, dopuszcza wyłącznie katalog produktów/kategorii,
  JPG/PNG/WebP, maks. 10 plików po 5 MB i sprawdza sygnaturę pliku
- ITN Autopay ma limit 192 KiB, sprawdza typ żądania, podpis, service ID, kwotę,
  walutę i zamówienie; transakcje operatora są rejestrowane idempotentnie, a późne
  lub kolizyjne płatności trafiają do ręcznego uzgodnienia zamiast zmieniać stock
- każdy przypadek uzgodnienia jest związany z konkretnym `RemoteID`; administrator
  wybiera akceptację płatności (`PAYMENT_ACCEPTED`) albo potwierdzenie zwrotu
  (`REFUND_CONFIRMED`), podaje referencję, a transakcja wykonuje CAS, kontroluje
  stock oraz zapisuje aktora i wynik. `NO_PAYMENT_FOUND` wolno użyć
  wyłącznie dla legacy `PENDING` bez zarejestrowanej płatności
- transakcje Autopay, przypadki uzgodnienia i zdarzenia statusów mają relację
  `RESTRICT`, więc usunięcie zamówienia nie może skasować rekordów
  finansowych/audytowych kaskadowo
- globalnie ustawiono CSP z allowlistą źródeł, HSTS, ochronę przed osadzaniem,
  `nosniff`, politykę referrera i ograniczenia uprawnień; CSP nadal dopuszcza
  skrypty/style inline wymagane przez obecny frontend i wymaga testu w przeglądarce

Te mechanizmy nie zastępują konfiguracji hosta, aktualizacji zależności,
monitoringu, kopii zapasowych ani testów penetracyjnych. Rate limiting działa
obecnie w pamięci pojedynczego procesu i ufa `CF-Connecting-IP`, więc origin musi
być osiągalny wyłącznie przez Cloudflare. Szczegóły i lista działań produkcyjnych są w
[Security & Operations](docs/SECURITY_OPERATIONS.md).

Kod odrzuca `AUTH_SECRET` i `PAYMENT_ACCESS_SECRET` krótsze niż 32 bajty, ale nie
potrafi potwierdzić ich losowości ani bezpiecznego przechowywania. Nadal brak MFA
administratora i współdzielonego limitera, CSP zawiera konieczne obecnie
`unsafe-inline`, a część tras polega na limitach body warstwy proxy.
Konfiguracja SMTP, Autopay, Zero Trust/WAF, backup/restore, monitoring i ACL sekretów
pozostają operacyjnie niezweryfikowane. Nie włączaj checkoutu na podstawie samego
przeglądu kodu.

Kod rejestracji wymaga potwierdzenia e-maila i ustawienia hasła dopiero po otwarciu
linku, nie wykonuje auto-loginu i zwraca neutralną odpowiedź, ale SMTP nie jest
skonfigurowane. Wysyłka 24-godzinnego linku, dostarczalność, ponowienie i cały
lifecycle konta wymagają testu live po uzyskaniu danych SMTP. Migracja nie uznaje
istniejących kont klientów za zweryfikowane; muszą przejść ten sam proces aktywacji.

## ✅ Status weryfikacji

| Obszar | Status | Znaczenie |
|--------|--------|-----------|
| Kod checkoutu/stocku/ITN | naprawy obecne i lokalnie sprawdzone | Idempotencja, osobny sekret/token wznowienia, expiry, wersjonowanie, log statusów, rejestr ITN, przypadki uzgodnienia per zdarzenie/`RemoteID` i limity body istnieją; nadal wymagają sandbox E2E i testów współbieżności na MySQL |
| Rejestracja i weryfikacja e-mail | kod obecny, testy statyczne zaliczone, dostawa niezweryfikowana | Hasło, nazwa i zgoda są przyjmowane dopiero po ważnym 24-godzinnym linku; bez kompletnego SMTP rejestracja nie jest dostępna |
| Schemat i migracja | Prisma validate OK, **nie wdrożone live** | Transakcje, przypadki uzgodnienia i zdarzenia statusów używają `RESTRICT`; migracji SQL nie wykonano na prawdziwym MySQL, a legacy wymaga raportu przed wdrożeniem |
| Zależności | **0 podatności, snapshot 2026-08-18** | Po czystym `npm ci --ignore-scripts` lock odtworzył Next 16.3.1; pełny i produkcyjny `npm audit --json` zwróciły 0 |
| Runtime Node.js | lokalnie 24.18.0; produkcja niezweryfikowana | Repo wymaga Node ≥22, zalecany Node 24; dokładną wersję trzeba odczytać z SEOHOST |
| TypeScript / test / lint / build | **lokalnie OK** | 33/33 testów, typecheck i ESLint przeszły; build Next 16.3.1 z fikcyjną niedostępną bazą zakończył się kodem 0 i utworzył `.next/BUILD_ID` |
| CI / aktualizacje | pliki dodane, zdalne uruchomienie niezweryfikowane | Workflow wykonuje czystą instalację bez lifecycle scripts, audit, test, typecheck, lint i build na Node 24; Dependabot obejmuje npm i GitHub Actions |
| SEOHOST / Cloudflare / MySQL / backup | **niezweryfikowane live** | Dokument opisuje stan wymagany, nie odczytaną konfigurację; brak potwierdzonej próby odtworzenia |
| SMTP | **brak danych konta** | TLS i SPF/DKIM/DMARC są zadeklarowane przez właściciela, lecz bez live readback; brak danych SMTP i testu dostarczalności |
| Autopay | **TBD / checkout wyłączony** | Brak sandbox E2E na publicznym ITN i pisemnego potwierdzenia CET/CEST; zwroty wykonuje się w portalu, a panel zapisuje ich potwierdzenie |
| MFA administratora | **TBD** | Kod aplikacji nie implementuje MFA; reguła Access i metoda MFA wymagają decyzji oraz testu |

Dokumentacja nie jest certyfikatem bezpieczeństwa ani potwierdzeniem gotowości
produkcyjnej. Status należy aktualizować wyłącznie na podstawie zapisanych,
powtarzalnych wyników z konkretnej wersji i środowiska.

## 🗺 Roadmap

### Zrobione ✅
- [x] Katalog, koszyk, checkout gościnny
- [x] Panel admina (produkty + zdjęcia, kategorie, zamówienia, ustawienia, hasło)
- [x] Magazyn i kod e-maili transakcyjnych
- [x] Kod i testy bazowego przepływu Autopay (bez potwierdzenia sandbox E2E)
- [x] Idempotencja checkoutu, 30 minut ważności płatności + 15 minut grace ITN,
      zwolnienie stocku po 45 minutach i kontrola współbieżności statusów
- [x] Konta klientów z historią zamówień i resetem hasła
- [x] Strony prawne (szablony), SEO, identyfikacja wizualna

### Następne 🔜
- [ ] Domknąć wdrożenie SEOHOST/Passenger i zweryfikować stronę główną z zewnątrz
- [ ] Produkcyjna konfiguracja i test SMTP (Google Workspace)
- [ ] Konfiguracja i pełny sandbox E2E Autopay
- [ ] Trwały wolumen uploadów, backupy oraz test odtworzenia
- [ ] Zamknięcie ustaleń z [Security & Operations](docs/SECURITY_OPERATIONS.md)
- [ ] Automatyczne zlecanie zwrotów Autopay z panelu oraz operacyjne wdrożenie crona wygaszającego rezerwacje

### Przyszłość 🧭
- [ ] Kody rabatowe, opinie produktów, newsletter
- [ ] Marketplace dla wielu twórców („Allegro dla rękodzielników")

## 📝 Licencja

Projekt prywatny — wszelkie prawa zastrzeżone.

---

Powered by [chybadziala.pl](https://chybadziala.pl)
