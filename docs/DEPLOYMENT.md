# Wdrożenie CraftRoni na serwer

Instrukcja zakłada serwer Linux, Node.js 20.9 lub nowszy, MySQL lub MariaDB oraz
domenę z HTTPS. Nie kopiuj lokalnego pliku `.env` na serwer bez przejrzenia go —
dane testowe i produkcyjne muszą być rozdzielone.

## SEOHOST: DirectAdmin i Node.js Selector

Kod aplikacji pozostaje poza katalogiem domeny:

```text
/home/srv80158/CraftRoni
```

Nie kopiuj projektu do `public_html` ani `private_html` i nie twórz w nich dowiązania
do `.env`. DirectAdmin/Passenger połączy URL domeny z procesem Node.js. Plik `.env`
pozostaje w katalogu aplikacji i powinien mieć uprawnienia `600`.

Po pobraniu aktualnego `main` utwórz `.env`:

```bash
cd /home/srv80158/CraftRoni
git pull --ff-only origin main
umask 077
cp -n .env.example .env
chmod 600 .env
nano .env
```

Sekret sesji można wygenerować przed aktywowaniem Node.js Selectora:

```bash
openssl rand -base64 32
```

Minimalna konfiguracja produkcyjna:

```env
DATABASE_URL="mysql://USER:HASLO@localhost:3306/BAZA"
NEXT_PUBLIC_APP_URL="https://craftroni.pl"
AUTH_SECRET="WYGENEROWANY_LOSOWY_SEKRET"
```

Jeżeli baza nie działa na tym samym serwerze, zamiast `localhost` użyj hosta
podanego przez operatora. Znaki specjalne w loginie lub haśle muszą być zakodowane
zgodnie z percent-encoding dla adresów URL.

W kreatorze „Node.js App” ustaw:

- wersja Node.js: `24.18.0`,
- tryb aplikacji: `Production`,
- katalog główny aplikacji: `CraftRoni`,
- URL aplikacji: domena `craftroni.pl`, pole ścieżki pozostaw puste,
- plik startowy aplikacji: `server.cjs`.

Nie ustawiaj ręcznie `PORT` ani `NODE_ENV`: port przekazuje Passenger, a
`NODE_ENV=production` wynika z trybu aplikacji. Po utworzeniu aplikacji panel pokaże
komendę aktywacji jej środowiska. Skopiuj ją dokładnie; będzie podobna do:

```bash
source /home/srv80158/nodevenv/CraftRoni/24/bin/activate
```

Po aktywowaniu środowiska zainstaluj również zależności potrzebne do budowania,
zastosuj migracje i zbuduj aplikację:

```bash
cd /home/srv80158/CraftRoni
npm ci --include=dev
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run test
NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 npm run build
test -s .next/BUILD_ID && echo "BUILD OK"
mkdir -p public/uploads/products public/uploads/categories
chmod 750 public/uploads public/uploads/products public/uploads/categories
```

Projekt ma ograniczoną do jednego workera konfigurację buildu dla współdzielonego
hostingu SEOHOST. Skrypt `npm run build` używa Webpacka, ponieważ domyślny
Turbopack może przekroczyć limit wątków. Nie uruchamiaj na serwerze polecenia
`next build` bezpośrednio: lokalny plik wykonywalny Next.js jest dostępny przez
skrypty npm, nie jako globalna komenda.

Pierwszego administratora utwórz zgodnie z sekcją „Utworzenie pierwszego
administratora” poniżej. Na końcu użyj przycisku `Restart` w Node.js App. Nie
uruchamiaj trwałego procesu przez zwykłe `npm start` w terminalu — zarządza nim
Passenger. Przy kolejnej aktualizacji wykonaj `git pull --ff-only`, instalację,
migracje, build i restart aplikacji w panelu.

## 1. Przygotowanie bazy i aplikacji

Utwórz pustą produkcyjną bazę z kodowaniem `utf8mb4` oraz osobnego użytkownika,
który ma prawa tylko do tej bazy. Następnie w katalogu aplikacji:

```bash
npm ci
cp .env.example .env
chmod 600 .env
```

W `.env` ustaw co najmniej:

```env
DATABASE_URL="mysql://USER:HASLO@HOST:3306/BAZA"
NEXT_PUBLIC_APP_URL="https://twoja-domena.pl"
AUTH_SECRET="dlugi-losowy-sekret"
```

Sekret można wygenerować poleceniem `openssl rand -base64 32`. Nie commituj `.env`
i nie przesyłaj jego zawartości w zgłoszeniach lub logach.

Wdróż strukturę bazy i bazową konfigurację:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

`db:migrate:deploy` stosuje wersjonowane migracje. `db:seed` jest idempotentny:
nie kasuje danych, nie dodaje produktów demonstracyjnych i nie tworzy administratora.
Na produkcji nie używaj `prisma db push --force-reset` ani `prisma migrate reset`.

## 2. Utworzenie pierwszego administratora

Tymczasowo dodaj do chronionego `.env`:

```env
ADMIN_EMAIL="twoj-adres@example.com"
ADMIN_NAME="Administrator"
ADMIN_PASSWORD="unikalne-haslo-majace-co-najmniej-12-znakow"
```

Uruchom:

```bash
npm run admin:create
```

Po komunikacie o utworzeniu konta usuń z `.env` linię `ADMIN_PASSWORD`.
`ADMIN_EMAIL` i `ADMIN_NAME` również nie są potrzebne do działania aplikacji.
Nie podawaj hasła jako argumentu komendy — trafiałoby do historii powłoki.

Ponowne wykonanie komendy dla tego samego administratora zmieni jego hasło oraz
unieważni stare sesje i tokeny resetu. Jeżeli wskazany e-mail należy już do konta
klienta, skrypt przerwie działanie zamiast automatycznie nadać mu rolę administratora.

Panel znajduje się pod `/admin`, a ekran logowania pod `/admin/login`. Po pierwszym
logowaniu przejdź do „Ustawienia”, uzupełnij dane sklepu, koszty wysyłki i — jeśli
chcesz — zmień hasło w zakładce „Konto”. Produkty, kategorie, zdjęcia i zamówienia
obsługuje się z menu panelu.

## 3. Autopay i poczta

Uzupełnij oddzielne dane produkcyjne:

```env
AUTOPAY_SERVICE_ID=""
AUTOPAY_SHARED_KEY=""
AUTOPAY_HASH_ALGORITHM="sha256"
AUTOPAY_SANDBOX="false"

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="CraftRoni <sklep@twoja-domena.pl>"
```

W Autopay ustaw adres ITN:
`https://twoja-domena.pl/api/payments/autopay/itn` oraz adres powrotu:
`https://twoja-domena.pl/zamowienie/potwierdzenie`. Najpierw wykonaj pełny test
na danych sandboxowych; dopiero potem przełącz dane i `AUTOPAY_SANDBOX=false`.

## 4. Weryfikacja i uruchomienie

```bash
npm run test
npm run lint
npm run build
NODE_ENV=production npm start
```

Proces powinien działać pod menedżerem usług (np. systemd) i być dostępny wyłącznie
przez reverse proxy z HTTPS. Proxy musi przekazywać `Host` i `X-Forwarded-For`.
Za Cloudflare ustaw SSL/TLS „Full (strict)” oraz wyłącz cache dla `/api/*` i `/admin`.
Endpoint Autopay ITN nie może być chroniony interaktywnym challenge.

Katalog `public/uploads` musi być trwały między wdrożeniami i zapisywalny przez
użytkownika procesu Node. Wykonuj backup zarówno bazy, jak i tego katalogu.

## 5. Kolejne aktualizacje

Przed aktualizacją zrób backup. Po pobraniu nowej wersji:

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run test
npm run lint
NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 npm run build
test -s .next/BUILD_ID && echo "BUILD OK"
```

Następnie zrestartuj usługę i sprawdź stronę sklepu, logowanie do panelu, zapis
ustawień oraz testowe zamówienie. Nie uruchamiaj ponownie `db:seed`, jeśli nie ma
takiej potrzeby; jest bezpieczny, ale służy tylko do uzupełnienia brakujących
danych bazowych.

## 6. Obowiązkowe przed publicznym startem

- Uzupełnij wszystkie miejsca `[UZUPEŁNIJ]` w regulaminie, polityce prywatności,
  zwrotach i dostawie prawdziwymi danymi sprzedawcy oraz warunkami realizacji.
- Wpisz właściwe dane kontaktowe i przewoźników.
- Skonfiguruj i przetestuj produkcyjne SMTP oraz Autopay.
- Dodaj prawdziwe produkty i zdjęcia; sprawdź stany magazynowe i ceny.
- Wykonaj test zakupu, płatności, e-maili, anulowania i zwrotu.
