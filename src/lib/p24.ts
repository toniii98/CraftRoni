import { createHash } from "crypto";

// Integracja z Przelewy24 (REST API v1).
// Dokumentacja: https://developers.przelewy24.pl
//
// Przepływ:
// 1. POST /api/orders rejestruje transakcję (registerTransaction) i odsyła
//    klienta na stronę płatności P24.
// 2. Po płatności P24 wywołuje nasz webhook (urlStatus) — weryfikujemy podpis
//    i potwierdzamy transakcję (verifyTransaction), dopiero wtedy zamówienie
//    dostaje status PAID.
//
// Gdy zmienne P24_* nie są ustawione, płatności online są wyłączone,
// a zamówienia pozostają w statusie PENDING (płatność ustalana mailowo).

export function isP24Configured(): boolean {
  return Boolean(
    process.env.P24_MERCHANT_ID &&
      process.env.P24_POS_ID &&
      process.env.P24_CRC &&
      process.env.P24_API_KEY
  );
}

function baseUrl(): string {
  return process.env.P24_SANDBOX === "false"
    ? "https://secure.przelewy24.pl"
    : "https://sandbox.przelewy24.pl";
}

function config() {
  return {
    merchantId: Number(process.env.P24_MERCHANT_ID),
    posId: Number(process.env.P24_POS_ID),
    crc: process.env.P24_CRC as string,
    apiKey: process.env.P24_API_KEY as string,
  };
}

// P24 wymaga podpisu sha384 z JSON-a o ściśle określonej kolejności pól.
function sha384(payload: Record<string, unknown>): string {
  return createHash("sha384").update(JSON.stringify(payload)).digest("hex");
}

function authHeader(): string {
  const { posId, apiKey } = config();
  return "Basic " + Buffer.from(`${posId}:${apiKey}`).toString("base64");
}

export interface P24RegisterParams {
  /** Numer zamówienia — używany jako sessionId w P24. */
  orderNumber: string;
  /** Kwota w złotych (zostanie przeliczona na grosze). */
  totalPln: number;
  customerEmail: string;
  customerName: string;
}

/**
 * Rejestruje transakcję w P24 i zwraca URL strony płatności.
 * Rzuca błąd, gdy rejestracja się nie powiedzie.
 */
export async function registerTransaction(params: P24RegisterParams): Promise<string> {
  const { merchantId, posId, crc } = config();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const amount = Math.round(params.totalPln * 100); // grosze
  const sessionId = params.orderNumber;

  const sign = sha384({ sessionId, merchantId, amount, currency: "PLN", crc });

  const response = await fetch(`${baseUrl()}/api/v1/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      merchantId,
      posId,
      sessionId,
      amount,
      currency: "PLN",
      description: `Zamówienie ${params.orderNumber}`,
      email: params.customerEmail,
      client: params.customerName,
      country: "PL",
      language: "pl",
      // Jawne UTF-8 — bez tego polskie znaki w opisie i nazwisku klienta
      // mogą wyświetlić się błędnie na stronie płatności P24.
      encoding: "UTF-8",
      urlReturn: `${appUrl}/zamowienie/potwierdzenie?order=${encodeURIComponent(params.orderNumber)}`,
      urlStatus: `${appUrl}/api/payments/p24/webhook`,
      sign,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { data?: { token?: string }; error?: string }
    | null;

  if (!response.ok || !data?.data?.token) {
    throw new Error(
      `P24: rejestracja transakcji nie powiodła się (HTTP ${response.status}): ${data?.error ?? "brak szczegółów"}`
    );
  }

  return `${baseUrl()}/trnRequest/${data.data.token}`;
}

export interface P24Notification {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

/** Weryfikuje podpis powiadomienia z webhooka P24. */
export function verifyNotificationSign(notification: P24Notification): boolean {
  const { crc } = config();
  const expected = sha384({
    merchantId: notification.merchantId,
    posId: notification.posId,
    sessionId: notification.sessionId,
    amount: notification.amount,
    originAmount: notification.originAmount,
    currency: notification.currency,
    orderId: notification.orderId,
    methodId: notification.methodId,
    statement: notification.statement,
    crc,
  });
  return expected === notification.sign;
}

/**
 * Potwierdza transakcję w P24 (wymagany krok — bez niego środki wracają do klienta).
 * Zwraca true, gdy P24 potwierdziło płatność.
 */
export async function verifyTransaction(params: {
  sessionId: string;
  orderId: number;
  amount: number;
}): Promise<boolean> {
  const { merchantId, posId, crc } = config();
  const sign = sha384({
    sessionId: params.sessionId,
    orderId: params.orderId,
    amount: params.amount,
    currency: "PLN",
    crc,
  });

  const response = await fetch(`${baseUrl()}/api/v1/transaction/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      merchantId,
      posId,
      sessionId: params.sessionId,
      amount: params.amount,
      currency: "PLN",
      orderId: params.orderId,
      sign,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { data?: { status?: string } }
    | null;

  return response.ok && data?.data?.status === "success";
}
