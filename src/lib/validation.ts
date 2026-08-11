import { z } from "zod";

// Wspólne schematy walidacji wejścia API (zod).
// Serwer nigdy nie ufa danym z przeglądarki — nawet z własnych formularzy.

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(slugRegex, "Slug może zawierać tylko małe litery, cyfry i myślniki");

// Pusty string traktujemy jak brak wartości (formularze wysyłają "")
const emptyToNull = z.literal("").transform(() => null);

// ============================================
// ZAMÓWIENIA (sklep)
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  customerEmail: z.email("Nieprawidłowy adres email").max(254),
  customerName: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  customerPhone: z.string().trim().max(30).optional().or(emptyToNull),
  shippingAddress: z.string().trim().min(3, "Podaj adres").max(300),
  shippingCity: z.string().trim().min(2, "Podaj miasto").max(100),
  shippingZip: z
    .string()
    .trim()
    .regex(/^\d{2}-\d{3}$/, "Kod pocztowy w formacie XX-XXX"),
  notes: z.string().trim().max(1000).optional().or(emptyToNull),
  termsAccepted: z.literal(true, "Wymagana akceptacja regulaminu"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================
// PRODUKTY (admin)
// ============================================

const productImageInputSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(200).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, "Nazwa jest za krótka").max(200),
  slug: slugSchema,
  description: z.string().max(10000).nullish().or(emptyToNull),
  price: z.number().positive("Cena musi być większa od zera").max(999999),
  salePrice: z
    .number()
    .positive("Cena promocyjna musi być większa od zera")
    .max(999999)
    .nullish(),
  sku: z.string().trim().max(64).nullish().or(emptyToNull),
  stock: z.number().int().min(0).max(100000),
  categoryId: z.string().min(1, "Wybierz kategorię"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(productImageInputSchema).max(10).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ============================================
// KATEGORIE (admin)
// ============================================

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "Nazwa jest za krótka").max(100),
  slug: slugSchema,
  description: z.string().max(2000).nullish().or(emptyToNull),
  image: z.string().trim().max(500).nullish().or(emptyToNull),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

// ============================================
// ZAMÓWIENIA (admin)
// ============================================

export const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  notes: z.string().trim().max(2000).optional().or(emptyToNull),
});

// ============================================
// USTAWIENIA (admin)
// ============================================

export const settingsUpdateSchema = z.object({
  storeName: z.string().trim().min(1).max(100),
  storeEmail: z.email("Nieprawidłowy adres email").max(254),
  storePhone: z.string().trim().max(30).optional().or(emptyToNull),
  showFreeShippingBanner: z.boolean(),
  freeShippingThreshold: z.number().min(0).max(1000000),
  defaultShippingCost: z.number().min(0).max(10000),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

// ============================================
// KONTA (hasła, rejestracja)
// ============================================

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(100, "Hasło może mieć maksymalnie 100 znaków");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Podaj obecne hasło"),
  newPassword: passwordSchema,
});

export const passwordResetRequestSchema = z.object({
  email: z.email("Nieprawidłowy adres email").max(254),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: z.email("Nieprawidłowy adres email").max(254),
  password: passwordSchema,
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  termsAccepted: z.literal(true, "Wymagana akceptacja regulaminu"),
});

/** Pierwszy komunikat błędu walidacji — do pokazania użytkownikowi. */
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Nieprawidłowe dane";
}
