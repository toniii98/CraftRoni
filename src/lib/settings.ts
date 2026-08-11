import { prisma } from "./prisma";

// Ustawienia sklepu przechowywane w tabeli `settings` (klucz -> wartość).
// Sekrety (SMTP, Przelewy24) celowo NIE trafiają do bazy — są w .env na serwerze.

export interface ShopSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  freeShippingThreshold: number;
  defaultShippingCost: number;
}

export const DEFAULT_SETTINGS: ShopSettings = {
  storeName: "CraftRoni",
  storeEmail: "kontakt@craftroni.pl",
  storePhone: "",
  freeShippingThreshold: 200,
  defaultShippingCost: 15,
};

const DB_KEYS = {
  storeName: "store_name",
  storeEmail: "store_email",
  storePhone: "store_phone",
  freeShippingThreshold: "free_shipping_threshold",
  defaultShippingCost: "default_shipping_cost",
} as const;

export async function getShopSettings(): Promise<ShopSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(DB_KEYS) } },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const parseNumber = (key: string, fallback: number): number => {
    const raw = byKey.get(key);
    if (raw === undefined) return fallback;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  };

  return {
    storeName: byKey.get(DB_KEYS.storeName) ?? DEFAULT_SETTINGS.storeName,
    storeEmail: byKey.get(DB_KEYS.storeEmail) ?? DEFAULT_SETTINGS.storeEmail,
    storePhone: byKey.get(DB_KEYS.storePhone) ?? DEFAULT_SETTINGS.storePhone,
    freeShippingThreshold: parseNumber(
      DB_KEYS.freeShippingThreshold,
      DEFAULT_SETTINGS.freeShippingThreshold
    ),
    defaultShippingCost: parseNumber(
      DB_KEYS.defaultShippingCost,
      DEFAULT_SETTINGS.defaultShippingCost
    ),
  };
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  const entries: Array<[string, string]> = [
    [DB_KEYS.storeName, settings.storeName],
    [DB_KEYS.storeEmail, settings.storeEmail],
    [DB_KEYS.storePhone, settings.storePhone],
    [DB_KEYS.freeShippingThreshold, String(settings.freeShippingThreshold)],
    [DB_KEYS.defaultShippingCost, String(settings.defaultShippingCost)],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );
}
