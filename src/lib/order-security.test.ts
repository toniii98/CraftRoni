import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutRequestHash,
  derivePaymentAccessToken,
  generateOrderNumber,
  hashCheckoutKey,
  isValidPaymentAccessToken,
  isValidCheckoutKey,
  MAX_ORDER_TOTAL_PLN,
  paymentValidityTime,
  reservationExpiry,
  verifyPaymentAccessToken,
} from "./order-security";

test("limit zamówienia nie przekracza limitu BLIK w Autopay", () => {
  assert.equal(MAX_ORDER_TOTAL_PLN, 75_000);
});

const base = {
  items: [
    { productId: "b", quantity: 2 },
    { productId: "a", quantity: 1 },
  ],
  customerEmail: " Klient@Example.com ",
  customerName: "Jan Kowalski",
  customerPhone: null,
  shippingAddress: "Testowa 1",
  shippingCity: "Warszawa",
  shippingZip: "00-001",
  notes: null,
  termsAccepted: true as const,
};

test("hash checkoutu jest stabilny po zmianie kolejności pozycji", () => {
  assert.equal(
    checkoutRequestHash(base),
    checkoutRequestHash({ ...base, items: [...base.items].reverse() })
  );
  assert.notEqual(
    checkoutRequestHash(base),
    checkoutRequestHash({ ...base, items: [{ productId: "a", quantity: 2 }] })
  );
});

test("klucz checkoutu ma wysoką entropię i jest hashowany", () => {
  const key = "4cf30a6e-9046-4bd7-9bf8-203ed96839dd";
  assert.equal(isValidCheckoutKey(key), true);
  assert.match(hashCheckoutKey(key), /^[a-f\d]{64}$/);
  assert.equal(isValidCheckoutKey("short"), false);
});

test("token dostępu do płatności jest oddzielony od klucza idempotencji", () => {
  const checkoutKey = "4cf30a6e-9046-4bd7-9bf8-203ed96839dd";
  const checkoutKeyHash = hashCheckoutKey(checkoutKey);
  const secret = "unit-test-secret-with-at-least-32-bytes";
  const token = derivePaymentAccessToken(
    checkoutKeyHash,
    secret
  );
  assert.notEqual(token, checkoutKey);
  assert.equal(isValidPaymentAccessToken(token), true);
  assert.equal(verifyPaymentAccessToken(token, checkoutKeyHash, secret), true);
  assert.equal(verifyPaymentAccessToken(token, checkoutKeyHash, `${secret}-rotated`), false);
});

test("numer zamówienia używa kryptograficznego sufiksu", () => {
  const first = generateOrderNumber(new Date("2026-08-18T10:00:00Z"));
  const second = generateOrderNumber(new Date("2026-08-18T10:00:00Z"));
  assert.match(first, /^CR-260818-[A-F\d]{16}$/);
  assert.notEqual(first, second);
});

test("rezerwacja zawiera osobne okno na dostarczenie ITN", () => {
  const now = new Date("2026-08-18T10:00:00.000Z");
  const reservationEnd = reservationExpiry(now);
  assert.equal(reservationEnd.toISOString(), "2026-08-18T10:45:00.000Z");
  assert.equal(paymentValidityTime(reservationEnd).toISOString(), "2026-08-18T10:30:00.000Z");
});
