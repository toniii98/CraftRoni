# 🎨 CraftRoni — craft.roni · polskie rękodzieło

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1)

> Sklep internetowy z ręcznie szytym rękodziełem: portfeliki, nerki i giga nerki.

## 📋 Spis treści

- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Szybki start (dev)](#-szybki-start-dev)
- [Zmienne środowiskowe](#-zmienne-środowiskowe)
- [Panel administracyjny](#-panel-administracyjny)
- [Płatności (Autopay)](#-płatności-autopay)
- [E-maile (SMTP)](#-e-maile-smtp)
- [Wdrożenie produkcyjne (VPS)](#-wdrożenie-produkcyjne-vps)
- [Struktura projektu](#-struktura-projektu)
- [Bezpieczeństwo](#-bezpieczeństwo)
- [Roadmap](#-roadmap)
- [UI Style Guide](docs/UI_STYLE_GUIDE.md) — paleta, typografia, komponenty, znaki marki

## 🎯 Funkcjonalności

**Sklep (klient):**
- ✅ Katalog produktów: filtrowanie po kategorii i cenie, sortowanie, paginacja, wyszukiwarka
- ✅ Strona produktu z galerią zdjęć i produktami powiązanymi
- ✅ Koszyk (localStorage) z progiem darmowej dostawy sterowanym z panelu
- ✅ Opcjonalny banner darmowej dostawy — włączany i wyłączany w panelu
- ✅ Formularz kontaktowy wysyłany przez Formspree z komunikatem o wyniku
- ✅ Checkout gościnny (konto niewymagane) z akceptacją regulaminu
- ✅ Konta klientów: rejestracja, logowanie, reset hasła („nie pamiętam hasła"),
  historia zamówień (`/konto`); zalogowanym checkout uzupełnia dane, a zamówienia
  trafiają do historii
- ✅ Płatności online Autopay (BLIK, przelewy, karty) — po skonfigurowaniu kluczy
- ✅ E-maile transakcyjne (potwierdzenie, płatność, wysyłka) — po skonfigurowaniu SMTP
- ✅ Strony prawne: regulamin, polityka prywatności, zwroty, dostawa *(szablony — patrz [Przed startem](#przed-startem-produkcyjnym))*
- ✅ SEO: metadata, sitemap.xml, robots.txt; własne strony 404/błędu

**Panel administracyjny (`/admin`):**
- ✅ Dashboard ze statystykami z bazy (produkty, zamówienia, przychód)
- ✅ CRUD produktów z **uploadem zdjęć** (kolejność, zdjęcie główne)
- ✅ CRUD kategorii z **uploadem zdjęcia kategorii**
- ✅ Zamówienia: lista z filtrami, zmiana statusu (z obsługą magazynu i e-maili), notatki z historią
- ✅ Ustawienia sklepu zapisywane w bazie (nazwa, kontakt, koszty dostawy, widoczność bannera)
- ✅ Zmiana hasła administratora
- ✅ Wersja mobilna panelu

**Magazyn:** stany zdejmowane przy zamówieniu (transakcyjnie — bez oversellingu),
zwracane przy anulowaniu; produkt z historią zamówień jest archiwizowany, nie usuwany.

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

```bash
git clone https://github.com/toniii98/CraftRoni.git
cd CraftRoni
npm install
cp .env.example .env
# uzupełnij DATABASE_URL i AUTH_SECRET (wygeneruj: openssl rand -base64 32)

npm run db:generate   # klient Prisma
npm run db:push       # schemat do bazy
npm run db:seed       # bazowe kategorie i ustawienia (bez kasowania danych)
# ustaw ADMIN_EMAIL i ADMIN_PASSWORD (min. 12 znaków) w .env
npm run admin:create  # pierwsze konto administratora
npm run dev           # http://localhost:3000
```

Baza (MySQL/MariaDB):
```sql
CREATE DATABASE craftroni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Przydatne skrypty: `npm run db:studio` (podgląd bazy),
`npm run db:migrate:deploy` (migracje na serwerze), `npm test`, `npm run lint`
i `npm run build`. W repozytorium nie ma komendy resetującej bazę, aby nie dało
się przypadkowo skasować danych produkcyjnych.

## ⚙️ Zmienne środowiskowe

Pełna lista z opisami w [.env.example](.env.example). Najważniejsze:

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/craftroni` |
| `AUTH_SECRET` | ✅ | Sekret JWT — **bez niego aplikacja nie wystartuje**. `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Publiczny adres sklepu (używany m.in. przy konfiguracji Autopay) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | podczas tworzenia admina | Dane używane wyłącznie przez `npm run admin:create`; hasło min. 12 znaków |
| `AUTOPAY_SERVICE_ID` / `AUTOPAY_SHARED_KEY` | — | Dane Autopay; puste = płatności online wyłączone |
| `AUTOPAY_HASH_ALGORITHM` | — | Algorytm uzgodniony z Autopay: `sha256` (domyślnie) lub `sha512` |
| `AUTOPAY_SANDBOX` | — | `true` używa testowego paywallu, `false` — produkcyjnego |
| `SMTP_*` | — | Dane SMTP; puste = e-maile nie są wysyłane |

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

## 💳 Płatności (Autopay)

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
   Cloudflare nie może wyświetlać na tej ścieżce interaktywnego challenge; wyjątek
   należy ograniczyć wyłącznie do `/api/payments/autopay/itn`.

Przepływ: zamówienie → wewnętrzna strona przekierowania → podpisany formularz
POST do paywallu Autopay → ITN `Base64(XML)` → weryfikacja service ID, SHA-256,
kwoty, waluty i zamówienia → idempotentny status `PAID` + e-mail do klienta.
Powrót przeglądarki nie oznacza zapłaty; jedynym źródłem potwierdzenia jest ITN.

Integracja zakłada model prowizji sprzedawcy, w którym klient płaci dokładnie
kwotę zamówienia. Bez skonfigurowanych kluczy zamówienia są przyjmowane ze
statusem `PENDING` i nie następuje przekierowanie do operatora. Zwroty wykonuje
się obecnie w portalu Autopay.

Przed produkcją wykonaj w sandboxie co najmniej: płatność poprawną, odrzuconą,
porzuconą oraz ponowienie identycznego ITN. Po teście potwierdź w bazie/panelu,
że tylko pierwszy poprawny `SUCCESS` zmienia zamówienie i wysyła e-mail.

## ✉️ E-maile (SMTP)

Sklep wysyła: potwierdzenie zamówienia (klient), powiadomienie o nowym zamówieniu
(na `store_email` z ustawień panelu), potwierdzenie płatności i informację o wysyłce.

Konfiguracja dla Google Workspace (zalecane: hasło aplikacji):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="sklep@twojadomena.pl"
SMTP_PASSWORD="haslo-aplikacji"    # Google: Konto → Bezpieczeństwo → Hasła aplikacji (wymaga 2FA)
SMTP_FROM="CraftRoni <sklep@twojadomena.pl>"
```

## 🌍 Wdrożenie produkcyjne (VPS)

Zarys (Node 20+, MySQL/MariaDB, reverse proxy):

Pełna, kolejna instrukcja jest w [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
Minimalny zestaw komend po skonfigurowaniu `.env`:

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run test && npm run lint && npm run build
NODE_ENV=production npm start
```

- Reverse proxy (nginx/caddy) → `localhost:3000`; proxy musi przekazywać
  `X-Forwarded-For` (rate limiting) i `Host`.
- Za Cloudflare: SSL/TLS w trybie **Full (strict)**; nie cache'ować `/api/*` ani `/admin`.
- Zdjęcia produktów lądują w `public/uploads/products` — katalog musi przetrwać
  deploy (wolumen/backup).
- Backup: regularny dump bazy + katalog uploadów.

### Przed startem produkcyjnym

- [ ] Uzupełnić strony prawne — miejsca `[UZUPEŁNIJ]` w `src/app/(shop)/{regulamin,prywatnosc,zwroty,dostawa}` (dane firmy, NIP, adresy) i usunąć żółte ostrzeżenia
- [ ] Ustawić produkcyjne `.env` (`AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` z domeną, SMTP, Autopay)
- [ ] Utworzyć administratora komendą `npm run admin:create` i usunąć potem `ADMIN_PASSWORD` z `.env`
- [ ] Dodać prawdziwe produkty i zdjęcia przez panel
- [ ] Zaktualizować dane kontaktowe w `src/lib/config.ts` (telefon, social media)

## 📁 Struktura projektu

```
CraftRoni/
├── assets/                     # Źródłowe pliki identyfikacji wizualnej
├── docs/UI_STYLE_GUIDE.md      # Styleguide marki
├── prisma/
│   ├── schema.prisma           # Schemat bazy
│   ├── migrations/             # Migracje wdrażane przez prisma migrate deploy
│   ├── create-admin.ts         # Bezpieczne tworzenie/reset hasła administratora
│   └── seed.ts                 # Bazowe kategorie i ustawienia; bez kasowania danych
├── public/
│   ├── brand/                  # Wygenerowane znaki marki (emblem, wordmark)
│   └── uploads/products/       # Zdjęcia produktów (upload z panelu; poza git)
├── src/
│   ├── app/
│   │   ├── (shop)/             # Sklep: strona główna, sklep, produkt, koszyk,
│   │   │                       #   zamówienie, konto klienta, strony prawne
│   │   ├── (admin)/admin/
│   │   │   ├── login/          # Logowanie (bez sidebara)
│   │   │   └── (panel)/        # Panel chroniony sesją: dashboard, produkty,
│   │   │                       #   kategorie, zamówienia, ustawienia
│   │   ├── api/
│   │   │   ├── auth/           # login/logout, /me, /register
│   │   │   ├── orders/         # składanie + odczyt zamówień (klient)
│   │   │   ├── payments/autopay/ # podpisany komunikat ITN Autopay
│   │   │   └── admin/          # CRUD + upload + ustawienia + hasło (requireAdmin)
│   │   ├── sitemap.ts, robots.ts, error.tsx, not-found.tsx
│   ├── components/             # layout/ ui/ shop/ admin/
│   ├── context/CartContext.tsx # Koszyk (localStorage)
│   ├── lib/                    # auth, prisma, settings, email, autopay, uploads,
│   │                           #   validation (zod), rate-limit, utils, config
│   └── proxy.ts                # Ochrona tras /admin (JWT)
└── .env.example
```

## 🔒 Bezpieczeństwo

- `AUTH_SECRET` wymagany — brak fallbacku; sesje JWT (httpOnly cookie) weryfikowane
  w bazie (wylogowanie unieważnia token natychmiast; w bazie hash SHA-256 tokenu)
- Walidacja wejścia zod na wszystkich endpointach przyjmujących dane
- Rate limiting: logowanie, rejestracja, składanie i odczyt zamówień
- Ceny i stany magazynowe liczone wyłącznie po stronie serwera (transakcje)
- Upload: tylko JPG/PNG/WebP, limit 5 MB, weryfikacja nagłówków pliku (magic bytes)
- Nagłówki bezpieczeństwa w `next.config.ts`; sekrety (SMTP, Autopay) tylko w `.env`,
  nigdy w bazie ani panelu

## 🗺 Roadmap

### Zrobione ✅
- [x] Katalog, koszyk, checkout gościnny
- [x] Panel admina (produkty + zdjęcia, kategorie, zamówienia, ustawienia, hasło)
- [x] Magazyn, e-maile transakcyjne, integracja Autopay
- [x] Konta klientów z historią zamówień i resetem hasła
- [x] Strony prawne (szablony), SEO, identyfikacja wizualna

### Następne 🔜
- [ ] Wdrożenie na VPS (domena + Cloudflare gotowe)
- [ ] Produkcyjna konfiguracja Autopay i SMTP (Google Workspace)
- [ ] Migracje Prisma + backupy
- [ ] Zwroty płatności Autopay z panelu + wygasanie nieopłaconych zamówień
      (zwalnianie stanu magazynowego)

### Przyszłość 🧭
- [ ] Kody rabatowe, opinie produktów, newsletter
- [ ] Marketplace dla wielu twórców („Allegro dla rękodzielników")

## 📝 Licencja

Projekt prywatny — wszelkie prawa zastrzeżone.

---

Made with ❤️ in Poland 🇵🇱 · Powered by [chybadziala.pl](https://chybadziala.pl)
