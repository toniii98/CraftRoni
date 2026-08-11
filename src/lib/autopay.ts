import { createHash, timingSafeEqual } from "crypto";

// Integracja z bramką Płatności Online Autopay.
// Dokumentacja: https://developers.autopay.pl/pdf?documentId=384
//
// Minimalny przepływ:
// 1. Sklep wysyła podpisany formularz POST do paywallu Autopay.
// 2. Autopay przesyła podpisany komunikat ITN na publiczny endpoint sklepu.
// 3. Dopiero poprawny ITN ze statusem SUCCESS oznacza opłacone zamówienie.

export type AutopayHashAlgorithm = "sha256" | "sha512";

export interface AutopayConfig {
  serviceId: string;
  sharedKey: string;
  hashAlgorithm: AutopayHashAlgorithm;
  gatewayUrl: string;
  sandbox: boolean;
}

export interface AutopayStartParams {
  orderNumber: string;
  totalPln: number;
  customerEmail: string;
}

export interface AutopayPaymentForm {
  action: string;
  fields: Record<string, string>;
}

export interface AutopayItn {
  serviceId: string;
  orderId: string;
  remoteId: string;
  amount: string;
  currency: string;
  gatewayId?: string;
  paymentDate: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILURE";
  paymentStatusDetails?: string;
  hash: string;
}

function hashAlgorithmFromEnv(): AutopayHashAlgorithm {
  const value = (process.env.AUTOPAY_HASH_ALGORITHM || "sha256").toLowerCase();
  if (value !== "sha256" && value !== "sha512") {
    throw new Error("AUTOPAY_HASH_ALGORITHM musi mieć wartość sha256 albo sha512");
  }
  return value;
}

export function isAutopaySandbox(): boolean {
  return process.env.AUTOPAY_SANDBOX !== "false";
}

function gatewayUrlFromEnv(sandbox: boolean): string {
  const value =
    process.env.AUTOPAY_GATEWAY_URL ||
    (sandbox ? "https://testpay.autopay.eu" : "https://pay.autopay.eu");
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("AUTOPAY_GATEWAY_URL musi używać HTTPS");
  }
  return url.toString().replace(/\/$/, "");
}

export function getAutopayConfig(): AutopayConfig {
  const serviceId = process.env.AUTOPAY_SERVICE_ID?.trim() || "";
  const sharedKey = process.env.AUTOPAY_SHARED_KEY || "";
  const sandbox = isAutopaySandbox();

  if (!/^\d{1,10}$/.test(serviceId)) {
    throw new Error("Brak lub nieprawidłowy AUTOPAY_SERVICE_ID");
  }
  if (!sharedKey) {
    throw new Error("Brak AUTOPAY_SHARED_KEY");
  }

  return {
    serviceId,
    sharedKey,
    hashAlgorithm: hashAlgorithmFromEnv(),
    gatewayUrl: gatewayUrlFromEnv(sandbox),
    sandbox,
  };
}

export function isAutopayConfigured(): boolean {
  try {
    getAutopayConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Autopay łączy niepuste wartości znakiem `|`, dopisuje klucz współdzielony
 * i oblicza SHA-256 (lub uzgodnione z operatorem SHA-512).
 */
export function calculateAutopayHash(
  values: Array<string | undefined>,
  sharedKey: string,
  algorithm: AutopayHashAlgorithm = "sha256"
): string {
  const message = [...values.filter((value): value is string => Boolean(value)), sharedKey].join("|");
  return createHash(algorithm).update(message, "utf8").digest("hex");
}

function safeHashEqual(actual: string, expected: string): boolean {
  if (!/^[a-f\d]+$/i.test(actual) || !/^[a-f\d]+$/i.test(expected)) return false;
  const actualBuffer = Buffer.from(actual.toLowerCase(), "hex");
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    actualBuffer.length > 0 &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function createAutopayPaymentForm(
  params: AutopayStartParams,
  config: AutopayConfig = getAutopayConfig()
): AutopayPaymentForm {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(params.orderNumber)) {
    throw new Error("Numer zamówienia nie spełnia wymagań Autopay");
  }
  if (!Number.isFinite(params.totalPln) || params.totalPln <= 0) {
    throw new Error("Kwota płatności Autopay musi być większa od zera");
  }
  if (!params.customerEmail || params.customerEmail.length > 255) {
    throw new Error("Nieprawidłowy adres e-mail płatnika");
  }

  const fields: Record<string, string> = {
    ServiceID: config.serviceId,
    OrderID: params.orderNumber,
    Amount: params.totalPln.toFixed(2),
    Description: `Zamowienie ${params.orderNumber}`.slice(0, 79),
    GatewayID: "0",
    Currency: "PLN",
    CustomerEmail: params.customerEmail,
  };

  fields.Hash = calculateAutopayHash(
    [
      fields.ServiceID,
      fields.OrderID,
      fields.Amount,
      fields.Description,
      fields.GatewayID,
      fields.Currency,
      fields.CustomerEmail,
    ],
    config.sharedKey,
    config.hashAlgorithm
  );

  return { action: config.gatewayUrl, fields };
}

export function verifyAutopayReturn(
  params: { serviceId?: string; orderId?: string; hash?: string },
  config: AutopayConfig = getAutopayConfig()
): boolean {
  if (!params.serviceId || !params.orderId || !params.hash) return false;
  if (params.serviceId !== config.serviceId) return false;
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(params.orderId)) return false;

  const expected = calculateAutopayHash(
    [params.serviceId, params.orderId],
    config.sharedKey,
    config.hashAlgorithm
  );
  return safeHashEqual(params.hash, expected);
}

function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    if (code.toLowerCase() === "amp") return "&";
    if (code.toLowerCase() === "lt") return "<";
    if (code.toLowerCase() === "gt") return ">";
    if (code.toLowerCase() === "quot") return '"';
    if (code.toLowerCase() === "apos") return "'";
    const radix = code.toLowerCase().startsWith("#x") ? 16 : 10;
    const digits = code.replace(/^#x?/i, "");
    const point = Number.parseInt(digits, radix);
    return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
  });
}

function extractXmlTag(xml: string, tag: string, required = true): string | undefined {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
  const matches = [...xml.matchAll(pattern)];
  if (matches.length === 0 && !required) return undefined;
  if (matches.length !== 1) {
    throw new Error(`Nieprawidłowa liczba pól XML: ${tag}`);
  }
  return decodeXmlEntities(matches[0][1]);
}

function decodeBase64Xml(encoded: string): string {
  const normalized = encoded.replace(/\s/g, "");
  if (!normalized || normalized.length > 131_072 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error("Nieprawidłowy komunikat Base64");
  }

  const bytes = Buffer.from(normalized, "base64");
  const canonical = bytes.toString("base64").replace(/=+$/, "");
  if (canonical !== normalized.replace(/=+$/, "")) {
    throw new Error("Nieprawidłowy komunikat Base64");
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function parseAutopayItn(encodedTransactions: string): AutopayItn {
  const xml = decodeBase64Xml(encodedTransactions);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || !xml.includes("<transactionList>")) {
    throw new Error("Nieprawidłowa struktura XML ITN");
  }

  const notification: AutopayItn = {
    serviceId: extractXmlTag(xml, "serviceID")!,
    orderId: extractXmlTag(xml, "orderID")!,
    remoteId: extractXmlTag(xml, "remoteID")!,
    amount: extractXmlTag(xml, "amount")!,
    currency: extractXmlTag(xml, "currency")!,
    gatewayId: extractXmlTag(xml, "gatewayID", false),
    paymentDate: extractXmlTag(xml, "paymentDate")!,
    paymentStatus: extractXmlTag(xml, "paymentStatus")! as AutopayItn["paymentStatus"],
    paymentStatusDetails: extractXmlTag(xml, "paymentStatusDetails", false),
    hash: extractXmlTag(xml, "hash")!,
  };

  if (!/^\d{1,10}$/.test(notification.serviceId)) throw new Error("Nieprawidłowe serviceID");
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(notification.orderId)) throw new Error("Nieprawidłowe orderID");
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(notification.remoteId)) throw new Error("Nieprawidłowe remoteID");
  if (!/^(0|[1-9]\d{0,13})\.\d{2}$/.test(notification.amount)) {
    throw new Error("Nieprawidłowa kwota ITN");
  }
  if (!/^(PLN|EUR|GBP|USD)$/.test(notification.currency)) throw new Error("Nieprawidłowa waluta ITN");
  if (notification.gatewayId && !/^\d{1,5}$/.test(notification.gatewayId)) {
    throw new Error("Nieprawidłowe gatewayID");
  }
  if (!/^\d{14}$/.test(notification.paymentDate)) throw new Error("Nieprawidłowa data ITN");
  if (!/^(PENDING|SUCCESS|FAILURE)$/.test(notification.paymentStatus)) {
    throw new Error("Nieprawidłowy status ITN");
  }
  if (notification.paymentStatusDetails && notification.paymentStatusDetails.length > 64) {
    throw new Error("Nieprawidłowe szczegóły statusu ITN");
  }
  if (!/^(?:[a-f\d]{64}|[a-f\d]{128})$/i.test(notification.hash)) {
    throw new Error("Nieprawidłowy hash ITN");
  }

  return notification;
}

export function verifyAutopayItn(
  notification: AutopayItn,
  config: AutopayConfig = getAutopayConfig()
): boolean {
  if (notification.serviceId !== config.serviceId) return false;
  const expected = calculateAutopayHash(
    [
      notification.serviceId,
      notification.orderId,
      notification.remoteId,
      notification.amount,
      notification.currency,
      notification.gatewayId,
      notification.paymentDate,
      notification.paymentStatus,
      notification.paymentStatusDetails,
    ],
    config.sharedKey,
    config.hashAlgorithm
  );
  return safeHashEqual(notification.hash, expected);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createAutopayItnConfirmation(
  notification: Pick<AutopayItn, "serviceId" | "orderId">,
  confirmation: "CONFIRMED" | "NOTCONFIRMED",
  config: AutopayConfig = getAutopayConfig()
): string {
  const hash = calculateAutopayHash(
    [notification.serviceId, notification.orderId, confirmation],
    config.sharedKey,
    config.hashAlgorithm
  );

  return `<?xml version="1.0" encoding="UTF-8"?>\n<confirmationList><serviceID>${escapeXml(notification.serviceId)}</serviceID><transactionsConfirmations><transactionConfirmed><orderID>${escapeXml(notification.orderId)}</orderID><confirmation>${confirmation}</confirmation></transactionConfirmed></transactionsConfirmations><hash>${hash}</hash></confirmationList>`;
}
