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
- [Płatności (Przelewy24)](#-płatności-przelewy24)
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
- ✅ Checkout gościnny (konto niewymagane) z akceptacją regulaminu
- ✅ Konta klientów: rejestracja, logowanie, reset hasła („nie pamiętam hasła"),
  historia zamówień (`/konto`); zalogowanym checkout uzupełnia dane, a zamówienia
  trafiają do historii
- ✅ Płatności online Przelewy24 (BLIK, przelewy, karty) — po skonfigurowaniu kluczy
- ✅ E-maile transakcyjne (potwierdzenie, płatność, wysyłka) — po skonfigurowaniu SMTP
- ✅ Strony prawne: regulamin, polityka prywatności, zwroty, dostawa *(szablony — patrz [Przed startem](#przed-startem-produkcyjnym))*
- ✅ SEO: metadata, sitemap.xml, robots.txt; własne strony 404/błędu

**Panel administracyjny (`/admin`):**
- ✅ Dashboard ze statystykami z bazy (produkty, zamówienia, przychód)
- ✅ CRUD produktów z **uploadem zdjęć** (kolejność, zdjęcie główne)
- ✅ CRUD kategorii z **uploadem zdjęcia kategorii**
- ✅ Zamówienia: lista z filtrami, zmiana statusu (z obsługą magazynu i e-maili), notatki z historią
- ✅ Ustawienia sklepu zapisywane w bazie (nazwa, kontakt, koszty dostawy)
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
| Płatności | Przelewy24 (REST API v1) |
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
npm run db:seed       # kategorie + produkty demo + admin
npm run dev           # http://localhost:3000
```

Baza (MySQL/MariaDB):
```sql
CREATE DATABASE craftroni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Przydatne skrypty: `npm run db:studio` (podgląd bazy), `npm run db:reset`
(reset + seed), `npm run lint`, `npm run build`.

## ⚙️ Zmienne środowiskowe

Pełna lista z opisami w [.env.example](.env.example). Najważniejsze:

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/craftroni` |
| `AUTH_SECRET` | ✅ | Sekret JWT — **bez niego aplikacja nie wystartuje**. `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Publiczny adres sklepu (używany m.in. przez webhook P24) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Konto admina tworzone przez seed |
| `P24_*` | — | Klucze Przelewy24; puste = płatności online wyłączone |
| `SMTP_*` | — | Dane SMTP; puste = e-maile nie są wysyłane |

## 🔑 Panel administracyjny

- Adres: `/admin` (logowanie: `/admin/login`)
- **Dev:** seed tworzy konto `admin@craftroni.pl` / `admin123`
- **Produkcja** (`NODE_ENV=production`): hasło z `ADMIN_PASSWORD`, a gdy puste —
  losowe, wypisane raz w konsoli podczas seeda
- Hasło zmienisz w panelu: Ustawienia → Konto

## 💳 Płatności (Przelewy24)

1. Załóż konto sprzedawcy na [przelewy24.pl](https://www.przelewy24.pl)
   (testy: [sandbox.przelewy24.pl](https://sandbox.przelewy24.pl)).
2. Z panelu P24 przepisz do `.env`: `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_CRC`,
   `P24_API_KEY`; `P24_SANDBOX="true"` dla środowiska testowego.
3. Webhook (`urlStatus`) wskazuje na `NEXT_PUBLIC_APP_URL/api/payments/p24/webhook` —
   **musi być publicznie osiągalny** (nie zadziała na localhost).

Przepływ: zamówienie → rejestracja transakcji → przekierowanie klienta do P24 →
webhook z weryfikacją podpisu SHA-384 + potwierdzenie transakcji → status `PAID`
+ e-mail do klienta. Bez skonfigurowanych kluczy zamówienia są przyjmowane ze
statusem `PENDING` (płatność do ustalenia mailowo).

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

```bash
npm ci
npx prisma generate
npx prisma db push        # docelowo: prisma migrate deploy (patrz niżej)
npm run build
NODE_ENV=production npm start   # port 3000; docelowo pod procesem (systemd/pm2)
```

- Reverse proxy (nginx/caddy) → `localhost:3000`; proxy musi przekazywać
  `X-Forwarded-For` (rate limiting) i `Host`.
- Za Cloudflare: SSL/TLS w trybie **Full (strict)**; nie cache'ować `/api/*` ani `/admin`.
- Zdjęcia produktów lądują w `public/uploads/products` — katalog musi przetrwać
  deploy (wolumen/backup).
- Backup: regularny dump bazy + katalog uploadów.

### Przed startem produkcyjnym

- [ ] Uzupełnić strony prawne — miejsca `[UZUPEŁNIJ]` w `src/app/(shop)/{regulamin,prywatnosc,zwroty,dostawa}` (dane firmy, NIP, adresy) i usunąć żółte ostrzeżenia
- [ ] Ustawić produkcyjne `.env` (`AUTH_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL` z domeną, SMTP, P24)
- [ ] Przejść z `db push` na migracje Prisma (`prisma migrate dev` → `prisma migrate deploy`)
- [ ] Podmienić produkty demo na prawdziwe (zdjęcia przez panel)
- [ ] Zaktualizować dane kontaktowe w `src/lib/config.ts` (telefon, social media)

## 📁 Struktura projektu

```
CraftRoni/
├── assets/                     # Źródłowe pliki identyfikacji wizualnej
├── docs/UI_STYLE_GUIDE.md      # Styleguide marki
├── prisma/
│   ├── schema.prisma           # Schemat bazy
│   └── seed.ts                 # Kategorie, produkty demo, admin, ustawienia
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
│   │   │   ├── payments/p24/   # webhook Przelewy24
│   │   │   └── admin/          # CRUD + upload + ustawienia + hasło (requireAdmin)
│   │   ├── sitemap.ts, robots.ts, error.tsx, not-found.tsx
│   ├── components/             # layout/ ui/ shop/ admin/
│   ├── context/CartContext.tsx # Koszyk (localStorage)
│   ├── lib/                    # auth, prisma, settings, email, p24, uploads,
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
- Nagłówki bezpieczeństwa w `next.config.ts`; sekrety (SMTP, P24) tylko w `.env`,
  nigdy w bazie ani panelu

## 🗺 Roadmap

### Zrobione ✅
- [x] Katalog, koszyk, checkout gościnny
- [x] Panel admina (produkty + zdjęcia, kategorie, zamówienia, ustawienia, hasło)
- [x] Magazyn, e-maile transakcyjne, integracja Przelewy24
- [x] Konta klientów z historią zamówień i resetem hasła
- [x] Strony prawne (szablony), SEO, identyfikacja wizualna

### Następne 🔜
- [ ] Wdrożenie na VPS (domena + Cloudflare gotowe)
- [ ] Produkcyjna konfiguracja P24 i SMTP (Google Workspace)
- [ ] Migracje Prisma + backupy
- [ ] Zwroty płatności P24 z panelu + wygasanie nieopłaconych zamówień
      (zwalnianie stanu magazynowego)

### Przyszłość 🧭
- [ ] Kody rabatowe, opinie produktów, newsletter
- [ ] Marketplace dla wielu twórców („Allegro dla rękodzielników")

## 📝 Licencja

Projekt prywatny — wszelkie prawa zastrzeżone.

---

Made with ❤️ in Poland 🇵🇱 · Powered by [chybadziala.pl](https://chybadziala.pl)
