// Konfiguracja sklepu CraftRoni

export const siteConfig = {
  name: "CraftRoni",
  description: "craft.roni — polskie rękodzieło. Ręcznie szyte portfeliki, nerki i giga nerki",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Kontakt
  contact: {
    email: "kontakt@craftroni.pl",
  },
  
  // Social media
  social: {
    instagram: "https://instagram.com/craft.roni",
  },
  
  // Ustawienia sklepu (próg darmowej dostawy, koszt wysyłki) są w bazie danych —
  // patrz src/lib/settings.ts i panel admina (Ustawienia).
  
  // Meta tagi
  meta: {
    title: "CraftRoni - Polskie Rękodzieło",
    description: "Ręcznie szyte portfeliki, nerki i giga nerki. Polskie rękodzieło — każda sztuka jedyna w swoim rodzaju.",
    keywords: ["rękodzieło", "handmade", "polskie rękodzieło", "nerki", "portfeliki", "prezenty"] as string[],
  },
};

export type SiteConfig = typeof siteConfig;
