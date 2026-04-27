# CraftRoni — UI Style Guide

Źródło prawdy dla wyglądu marki. Każda zmiana w UI powinna być zgodna z tym dokumentem.

## 🎨 Paleta kolorów

| Nazwa            | Hex       | Zastosowanie                                    |
|------------------|-----------|-------------------------------------------------|
| CraftRoni Red    | `#E60000` | Kolor wiodący — przyciski primary, akcenty, CTA |
| Deep Maroon      | `#8B0000` | Hover, ciemniejsze akcenty, podkreślenia        |
| Off-White        | `#F9F7F2` | Tło globalne strony — ciepły, papierowy odcień  |
| Charcoal         | `#2D2D2D` | Tekst podstawowy, ciemne elementy               |
| Surface (White)  | `#FFFFFF` | Tło kart produktowych, modali, formularzy       |

> Nie używamy zimnego białego (`#FFFFFF`) jako tła globalnego — to psuje rzemieślniczy klimat. Białe są tylko karty/komponenty na tle off-white.

## ✍️ Typografia

| Element          | Font              | Waga       | Rozmiar |
|------------------|-------------------|------------|---------|
| H1               | Playfair Display  | Bold (700) | 48 px   |
| H2               | Playfair Display  | Regular    | 36 px   |
| H3 / podtytuły   | Playfair Display  | Regular    | 24 px   |
| Body             | Montserrat        | Regular    | 16 px   |
| Body (bold)      | Montserrat        | Bold (700) | 16 px   |
| Caption / meta   | Montserrat        | Regular    | 12–14 px|

Zasada: **serif (Playfair) tylko na nagłówki**, **sans (Montserrat) na całą resztę**. Bez wyjątków.

## 🔘 Komponenty

### Buttony
- **Primary** — pełne tło `#E60000`, biały tekst, rounded, hover → `#8B0000`. Główne CTA („Add to Cart", „Złóż zamówienie").
- **Outline** — przezroczyste tło, ramka 2 px `#E60000`, tekst `#E60000`, hover → delikatne czerwone tło. Akcje drugorzędne („Learn More", „Poznaj nas").
- **Link / Text** — sam tekst `#E60000` z czerwonym podkreśleniem (offset). „View Details", linki kontekstowe.

### Karta produktu
- Tło `#FFFFFF`, lekkie zaokrąglenie, subtelny cień.
- Layout: zdjęcie u góry → nazwa (bold) → cena → **przycisk „Add to Cart" zawsze widoczny pod ceną** (nie chowany w hover).

### Inputy
- Label nad polem, `#2D2D2D`.
- Pole z ramką, focus → ramka `#E60000`.
- Placeholder szary, dyskretny.

### Ikony
- Linearne, w kolorze `#E60000` na elementach interaktywnych.
- Zestaw: koszyk, serce, lupa, user, liść, paczka, monitor/sklep.

## 🧩 Inne

- Globalny scrollbar i focus ring w kolorze `#E60000`.
- Brak dark mode — strona zawsze jasna.
- Animacje subtelne (fade-in, transition na kolorach), bez efektownych transformacji.

---

_Ostatnia aktualizacja: 2026-04-27._
