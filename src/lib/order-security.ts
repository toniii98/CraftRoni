import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { assertStrongPaymentAccessSecret } from "./runtime-env";
export { TERMS_VERSION } from "./legal";

export const MAX_QUANTITY_PER_PRODUCT = 99;
export const MAX_TOTAL_QUANTITY = 100;
// Najniższy oficjalny limit pojedynczej transakcji wśród podstawowych kanałów
// PBL/karta/fast transfer/BLIK dotyczy BLIK. Wyższe kwoty mogłyby zarezerwować
// stock, a następnie zostać odrzucone przez bramkę.
export const MAX_ORDER_TOTAL_PLN = 75_000;
export const PAYMENT_ACCESS_COOKIE = "craftroni-payment-access";
export const ORDER_PAYMENT_VALIDITY_MINUTES = 30;
export const ORDER_ITN_GRACE_MINUTES = 15;
export const ORDER_RESERVATION_MINUTES =
  ORDER_PAYMENT_VALIDITY_MINUTES + ORDER_ITN_GRACE_MINUTES;

export interface CheckoutHashInput {
  items: Array<{ productId: string; quantity: number }>;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  notes?: string | null;
  termsAccepted: true;
}

export function isValidCheckoutKey(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{20,128}$/.test(value));
}

export function hashCheckoutKey(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function derivePaymentAccessToken(
  checkoutKeyHash: string,
  secret = assertStrongPaymentAccessSecret(process.env.PAYMENT_ACCESS_SECRET)
): string {
  return createHmac("sha256", secret)
    .update(`craftroni-payment-access-v1\0${checkoutKeyHash}`, "utf8")
    .digest("base64url");
}

export function isValidPaymentAccessToken(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export function verifyPaymentAccessToken(
  token: string | null | undefined,
  checkoutKeyHash: string | null | undefined,
  secret?: string
): boolean {
  if (!isValidPaymentAccessToken(token) || !checkoutKeyHash || !/^[a-f\d]{64}$/.test(checkoutKeyHash)) {
    return false;
  }
  const expected = derivePaymentAccessToken(
    checkoutKeyHash,
    secret ?? assertStrongPaymentAccessSecret(process.env.PAYMENT_ACCESS_SECRET)
  );
  return timingSafeEqual(Buffer.from(token, "ascii"), Buffer.from(expected, "ascii"));
}

export function checkoutRequestHash(input: CheckoutHashInput): string {
  const canonical = {
    items: [...input.items]
      .map((item) => ({ productId: item.productId, quantity: item.quantity }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone?.trim() || null,
    shippingAddress: input.shippingAddress.trim(),
    shippingCity: input.shippingCity.trim(),
    shippingZip: input.shippingZip.trim(),
    notes: input.notes?.trim() || null,
    termsAccepted: true,
  };
  return createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}

export function generateOrderNumber(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `CR-${date}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function reservationExpiry(now = new Date()): Date {
  return new Date(now.getTime() + ORDER_RESERVATION_MINUTES * 60_000);
}

export function paymentValidityTime(reservationExpiresAt: Date): Date {
  return new Date(reservationExpiresAt.getTime() - ORDER_ITN_GRACE_MINUTES * 60_000);
}
