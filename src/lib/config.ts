// Konfiguracja sklepu CraftRoni

export const siteConfig = {
  name: "CraftRoni",
  description: "Polski sklep z rękodziełem - unikalne, ręcznie robione produkty od polskich twórców",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Kontakt
  contact: {
    email: "kontakt@craftroni.pl",
    phone: "+48 123 456 789",
  },
  
  // Social media
  social: {
    instagram: "https://instagram.com/craftroni",
    facebook: "https://facebook.com/craftroni",
  },
  
  // Ustawienia sklepu
  shop: {
    currency: "PLN",
    locale: "pl-PL",
    freeShippingThreshold: 200, // Darmowa dostawa od 200 PLN
    defaultShippingCost: 15,
  },
  
  // Meta tagi
  meta: {
    title: "CraftRoni - Polskie Rękodzieło",
    description: "Odkryj unikalne, ręcznie robione produkty od polskich twórców. Biżuteria, ceramika, tekstylia i więcej.",
    keywords: ["rękodzieło", "handmade", "polskie rękodzieło", "biżuteria", "ceramika", "prezenty"] as string[],
  },
};

export type SiteConfig = typeof siteConfig;
