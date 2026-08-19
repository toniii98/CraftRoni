# CraftRoni — UI Style Guide

Źródło prawdy dla wyglądu marki. Każda zmiana w UI powinna być zgodna z tym
dokumentem oraz z dostarczonymi materiałami w `assets/`. Nie tworzymy zastępczego
kierunku wizualnego bez akceptacji właścicielki marki.

Kolejność źródeł przy wdrażaniu:

1. dostarczone znaki i materiały w `assets/` — kształt i charakter marki,
2. tokeny w `src/app/globals.css` — kolory i fonty używane przez aplikację,
3. współdzielone komponenty w `src/components/ui` — zachowanie kontrolek,
4. ten dokument — reguły kompozycji i spójności.

Nazwy kategorii produktowych pozostają dokładnie: **Portfeliki**, **Nerki**,
**Giga nerki**. Nie zastępujemy ich ogólną taksonomią rękodzieła.

## 🏷 Znaki marki

Pliki źródłowe: `/assets` (oryginalne PNG). Pliki produkcyjne (przycięte,
przezroczyste tło): `/public/brand`.

| Plik | Zastosowanie |
|------|--------------|
| `public/brand/wordmark.png` | Poziomy napis „craft.roni · polskie rękodzieło" — logo w nagłówku sklepu, materiały poziome |
| `public/brand/emblem.png` | Okrągły emblemat (postać + igła) — hero, strona logowania, favicon, social media, naklejki |
| `src/app/icon.png` / `apple-icon.png` | Favicony wygenerowane z emblematu (białe tło) |

Zasady:
- Wordmark na jasnych tłach (napis jest czarny). Na ciemnych tłach używać samego
  tekstu w kolorze białym/primary — nie ma jeszcze białej wersji wordmarku.
- **Emblemat działa na dowolnym tle**: obszar wokół grafiki jest przezroczysty,
  ale białe elementy postaci (fartuszek, twarz, kołnierz) są kryjąco białe.
  Oczka liter w otaczających napisach pozostają przezroczyste — tak jak
  w poprawnej typografii.
- Nazwa marki w tekstach: **craft.roni** (małe litery, z kropką) w kontekście
  brandowym; „CraftRoni" w tekstach technicznych/metadata.

## 🎨 Paleta kolorów

| Nazwa            | Hex       | Zastosowanie                                    |
|------------------|-----------|-------------------------------------------------|
| CraftRoni Red    | `#E60000` | `primary` — przyciski główne, akcenty, CTA      |
| Deep Maroon      | `#8B0000` | `primary-dark` — hover i akcje niebezpieczne    |
| Off-White        | `#F9F7F2` | `background` — globalne, ciepłe tło             |
| Charcoal         | `#2D2D2D` | `foreground` — tekst i ciemna stopka            |
| Surface (White)  | `#FFFFFF` | `surface` — karty, formularze i nagłówek        |
| Warm Border      | `#E5E0D6` | `border` — subtelne obramowania                 |
| Muted            | `#6B6B6B` | `muted` — tekst drugorzędny i metadane          |

> Nie używamy zimnego białego (`#FFFFFF`) jako tła globalnego — to psuje
> rzemieślniczy klimat. Białe są tylko karty/komponenty na tle off-white.
> W kodzie używamy nazw tokenów (`bg-primary`, `text-muted`, `border-border`),
> a nie powielonych wartości hex.

## ✍️ Typografia

| Rola | Font | Typowa skala w aplikacji |
|------|------|--------------------------|
| Hero H1 | Playfair Display 700 | responsywnie ok. 36–48 px |
| Tytuł strony / produktu | Playfair Display 700 | ok. 30 px |
| Nagłówek sekcji | Playfair Display 600–700 | ok. 20–30 px |
| Body / kontrolki | Montserrat 400–600 | 16 px |
| Caption / meta | Montserrat 400–600 | 12–14 px |

Nagłówki semantyczne `h1`–`h6` dziedziczą Playfair Display z
`globals.css`; treść, formularze i nawigacja używają Montserrat. Skala ma być
responsywna — ważniejsza jest hierarchia niż jedna stała wartość na wszystkich
widokach. Nazwa marki może używać Playfair jako element identyfikacji (np. stopka).

## 🔘 Komponenty

### Buttony

Podstawą jest `src/components/ui/Button.tsx`; dostępne warianty:

- **Primary** — pełne tło `primary`, biały tekst, hover `primary-dark`; główne CTA
  („Dodaj do koszyka”, „Złóż zamówienie”).
- **Secondary** — biała powierzchnia, tekst `foreground`, delikatna ramka; neutralna akcja.
- **Outline** — przezroczyste tło, ramka 2 px `primary`, czerwony tekst; akcja drugorzędna.
- **Ghost** — bez ramki, neutralny tekst; akcja o małej wadze.
- **Danger** — `primary-dark`; usuwanie/anulowanie wymagające wyraźnego opisu.
- **Link** — tekst `primary` z podkreśleniem i offsetem; linki kontekstowe.

Wszystkie warianty zachowują widoczny focus, stan disabled i czytelny stan
ładowania. Dla nawigacji używamy semantycznego `Link`, nie przycisku udającego link.

### Karta produktu
- Tło `#FFFFFF`, lekkie zaokrąglenie, subtelny cień.
- Layout: zdjęcie 1:1 u góry → kategoria → nazwa → cena → **przycisk
  „Dodaj do koszyka” zawsze widoczny pod ceną** (nie chowany w hover).
- Oznaczenia promocji, wyróżnienia i braku stanu muszą mieć tekst, nie tylko kolor.
- Ikona serca w obecnej karcie nie jest działającą listą życzeń; nie opisujemy jej
  jako funkcji sklepu, dopóki zachowanie nie zostanie zaimplementowane.

### Inputy
- Label nad polem, `#2D2D2D`.
- Pole z ramką, focus → ramka `#E60000`.
- Placeholder szary, dyskretny.
- Błąd powinien znajdować się pod polem, być powiązany z kontrolką przez
  `aria-invalid`/`aria-describedby` i nie może być komunikowany wyłącznie kolorem.
  Współdzielony `Input` wymaga jeszcze uzupełnienia tego powiązania ARIA.

### Ikony
- Linearne; czerwone dla akcentów albo neutralne z przejściem do `primary` na
  hover/focus.
- Biblioteka: Lucide React. Ikony akcji bez widocznej etykiety wymagają
  jednoznacznego `aria-label`.
- Zestaw: koszyk, serce, lupa, użytkownik, paczka, dostawa oraz ikony panelu.

## 🧩 Inne

- Globalny scrollbar i focus ring w kolorze `#E60000`.
- Brak dark mode — strona zawsze jasna.
- Animacje subtelne (fade-in, zmiany kolorów i cienia). Nowe animacje muszą
  respektować `prefers-reduced-motion`; należy też uzupełnić tę obsługę dla
  istniejących animacji przed uznaniem dostępności za zweryfikowaną.
- Publiczny sklep i panel korzystają z tych samych tokenów. Panel może być
  gęstszy informacyjnie, ale nie tworzy osobnej palety marki.
- Układ jest mobile-first: karty przechodzą od dwóch kolumn na małym ekranie,
  nawigacja ma wariant mobilny, a tabele panelu zachowują poziome przewijanie.
- Stopka zawiera ustalone oznaczenie `>_ Powered by chybadziala.pl` z subtelnym
  kursorem; nie zastępujemy go innym podpisem bez decyzji projektowej.

## ♿ Minimalna kontrola przed zmianą UI

- kolejność klawiatury i widoczny focus,
- poprawne label/`aria-label` oraz semantyka nagłówków,
- zoom 200% i szerokości mobilne bez utraty akcji,
- kontrast tekstu, ikon i stanów interaktywnych,
- tekstowa informacja o błędach/statusach,
- obrazy z adekwatnym `alt` (dekoracyjne z pustym `alt`),
- brak obietnicy funkcji, która jest tylko makietą lub placeholderem.

---

_Ostatnia aktualizacja: 2026-08-11._
