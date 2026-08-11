# Wdrożenie CraftRoni na serwer

Instrukcja zakłada serwer Linux, Node.js 22 LTS, MySQL lub MariaDB, domenę z HTTPS
oraz reverse proxy (nginx albo Caddy). Nie kopiuj lokalnego pliku `.env` na serwer
bez przejrzenia go — dane testowe i produkcyjne muszą być rozdzielone.

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
npm run build
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
