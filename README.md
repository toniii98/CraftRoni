# 🎨 CraftRoni - Polski Sklep z Rękodziełem

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1)

> Unikalne, ręcznie robione produkty od polskich twórców.

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Technologie](#-technologie)
- [Wymagania](#-wymagania)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [Uruchomienie](#-uruchomienie)
- [Struktura projektu](#-struktura-projektu)
- [Roadmap](#-roadmap)

## 🎯 O projekcie

CraftRoni to sklep internetowy z polskim rękodziełem. Projekt powstał jako:
- Platforma sprzedaży unikalnych, ręcznie robionych produktów
- Wsparcie dla polskich twórców i rzemieślników
- Projekt edukacyjny do nauki programowania

### Funkcjonalności MVP:
- ✅ Katalog produktów z kategoriami
- ✅ Koszyk i proces zakupowy
- ✅ Panel administracyjny
- 🔄 Integracja z Przelewy24 (w przygotowaniu)
- 📋 Widget Instagram (planowany)

## 🛠 Technologie

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16 (App Router) |
| Język | TypeScript |
| Stylowanie | Tailwind CSS 4 |
| ORM | Prisma 6 |
| Baza danych | MySQL (MariaDB) |
| Płatności | Przelewy24 |
| Ikony | Lucide React |

## 📦 Wymagania

- Node.js 18+ 
- npm lub yarn
- MySQL 8+ lub MariaDB 10.5+
- Git

## 🚀 Instalacja

1. **Sklonuj repozytorium:**
```bash
git clone https://github.com/toniii98/CraftRoni.git
cd CraftRoni
```

2. **Zainstaluj zależności:**
```bash
npm install
```

3. **Skopiuj plik konfiguracyjny:**
```bash
cp .env.example .env
```

4. **Skonfiguruj zmienne środowiskowe** (patrz sekcja [Konfiguracja](#-konfiguracja))

5. **Wygeneruj klienta Prisma:**
```bash
npm run db:generate
```

6. **Zastosuj schemat do bazy danych:**
```bash
npm run db:push
```

7. **Wypełnij bazę przykładowymi danymi (opcjonalnie):**
```bash
npm run db:seed
```

## ⚙️ Konfiguracja

Edytuj plik `.env` i uzupełnij:

```env
# Baza danych
DATABASE_URL="mysql://user:password@localhost:3306/craftroni"

# Aplikacja
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Autoryzacja (wygeneruj: openssl rand -base64 32)
AUTH_SECRET="twoj-tajny-klucz"

# Przelewy24 (opcjonalnie na start)
P24_MERCHANT_ID=""
P24_POS_ID=""
P24_CRC=""
```

### Utworzenie bazy danych (MySQL):
```sql
CREATE DATABASE craftroni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 🏃 Uruchomienie

**Tryb deweloperski:**
```bash
npm run dev
```
Aplikacja dostępna pod: http://localhost:3000

**Build produkcyjny:**
```bash
npm run build
npm start
```

**Prisma Studio (podgląd bazy):**
```bash
npx prisma studio
```

## 📁 Struktura projektu

```
CraftRoni/
├── prisma/
│   └── schema.prisma       # Schemat bazy danych
├── public/                 # Pliki statyczne
│   └── images/            # Obrazy
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (shop)/       # Strony sklepu
│   │   ├── (admin)/      # Panel administracyjny
│   │   ├── api/          # API endpoints
│   │   ├── layout.tsx    # Główny layout
│   │   └── page.tsx      # Strona główna
│   ├── components/        # Komponenty React
│   │   ├── layout/       # Header, Footer
│   │   ├── ui/           # Przyciski, inputy, etc.
│   │   └── shop/         # Komponenty sklepowe
│   ├── lib/              # Utilities
│   │   ├── prisma.ts     # Klient Prisma
│   │   ├── utils.ts      # Funkcje pomocnicze
│   │   └── config.ts     # Konfiguracja
│   └── types/            # Definicje TypeScript
├── .env.example          # Przykład zmiennych środowiskowych
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🗺 Roadmap

### Faza 1 - MVP ✅
- [x] Inicjalizacja projektu
- [x] Konfiguracja Next.js + Prisma
- [x] Schemat bazy danych
- [x] Podstawowe komponenty UI
- [ ] Katalog produktów
- [ ] Koszyk
- [ ] Checkout + Przelewy24
- [ ] Panel admin

### Faza 2 - Rozszerzenia
- [ ] Newsletter
- [ ] Opinie produktów
- [ ] Kody rabatowe
- [ ] Blog
- [ ] SEO optymalizacja

### Faza 3 - Przyszłość
- [ ] Marketplace dla wielu twórców
- [ ] Aplikacja mobilna
- [ ] Integracja z hurtowniami

## 👨‍💻 Autor

CraftRoni - projekt edukacyjny

## 📝 Licencja

Projekt prywatny - wszelkie prawa zastrzeżone.

---

Made with ❤️ in Poland 🇵🇱
