import nodemailer, { type Transporter } from "nodemailer";
import { getShopSettings } from "./settings";

// Wysyłka e-maili transakcyjnych przez SMTP (konfiguracja w .env).
// Gdy SMTP nie jest skonfigurowane, funkcje logują ostrzeżenie i nie przerywają
// działania sklepu. Błędy wysyłki nigdy nie wywracają obsługi zamówienia.

export interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentUrl?: string;
}

export interface SmtpConfig {
  host: string;
  port: 465 | 587;
  from: string;
  secure: boolean;
  requireTLS: boolean;
  auth?: { user: string; pass: string };
}

type EmailEnvironment = Readonly<Record<string, string | undefined>>;

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

function assertHeaderSafe(name: string, value: string) {
  if (value.includes("\r") || value.includes("\n")) {
    throw new Error(`${name} zawiera niedozwolony znak nowej linii`);
  }
}

/** Parsuje konfigurację bez wykonywania połączenia SMTP. */
export function smtpConfigFromEnvironment(
  environment: EmailEnvironment = process.env
): SmtpConfig | null {
  const host = trimmed(environment.SMTP_HOST);
  const from = trimmed(environment.SMTP_FROM);
  const user = trimmed(environment.SMTP_USER);
  const password = environment.SMTP_PASSWORD ?? "";

  // Sam domyślny SMTP_PORT w pliku env nie oznacza włączonej poczty.
  if (!host && !from && !user && !password) return null;

  const rawPort = trimmed(environment.SMTP_PORT);
  if (!host || !rawPort || !from) {
    throw new Error("Niepełna konfiguracja SMTP: wymagane są SMTP_HOST, SMTP_PORT i SMTP_FROM");
  }
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("Niepełna konfiguracja SMTP: SMTP_USER i SMTP_PASSWORD muszą występować razem");
  }

  const port = Number(rawPort);
  if (port !== 465 && port !== 587) {
    throw new Error("SMTP_PORT musi mieć wartość 465 albo 587");
  }
  if (host.length > 255 || from.length > 320) {
    throw new Error("Konfiguracja SMTP przekracza dozwoloną długość");
  }
  assertHeaderSafe("SMTP_HOST", host);
  assertHeaderSafe("SMTP_FROM", from);
  if (user) assertHeaderSafe("SMTP_USER", user);

  return {
    host,
    port,
    from,
    secure: port === 465,
    requireTLS: port === 587,
    auth: user ? { user, pass: password } : undefined,
  };
}

export function isEmailConfigured(): boolean {
  return smtpConfigFromEnvironment() !== null;
}

let transporter: Transporter | null = null;
let transporterConfig: SmtpConfig | null = null;

function getTransporter(): { transport: Transporter; config: SmtpConfig } | null {
  const config = smtpConfigFromEnvironment();
  if (!config) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      auth: config.auth,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
      tls: {
        minVersion: "TLSv1.2",
        servername: config.host,
      },
    });
    transporterConfig = config;
  }
  return { transport: transporter, config: transporterConfig ?? config };
}

function safeEmailError(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== "object") return { kind: "unknown" };

  const details: Record<string, string | number> = {};
  for (const key of ["code", "command", "responseCode"] as const) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === "string" || typeof value === "number") details[key] = value;
  }
  return Object.keys(details).length > 0 ? details : { kind: "smtp-error" };
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  try {
    const smtp = getTransporter();
    if (!smtp) {
      console.warn("[email] SMTP nieskonfigurowane — wiadomość pominięta");
      return;
    }
    await smtp.transport.sendMail({ from: smtp.config.from, to, subject, html });
  } catch (error) {
    // Nie logujemy odbiorcy, tematu, treści ani komunikatu serwera SMTP, bo mogą
    // zawierać dane osobowe. Kody wystarczają do diagnozy klasy błędu.
    console.error("[email] Wysyłka nie powiodła się", safeEmailError(error));
  }
}

// ============================================
// Szablon
// ============================================

const formatPln = (value: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orderItemsTable(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e0d6;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e0d6;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e0d6;text-align:right;">${formatPln(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr style="background:#f9f7f2;">
          <th style="padding:8px 12px;text-align:left;">Produkt</th>
          <th style="padding:8px 12px;text-align:center;">Ilość</th>
          <th style="padding:8px 12px;text-align:right;">Kwota</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:6px 12px;text-align:right;color:#6b6b6b;">Produkty:</td><td style="padding:6px 12px;text-align:right;">${formatPln(order.subtotal)}</td></tr>
        <tr><td colspan="2" style="padding:6px 12px;text-align:right;color:#6b6b6b;">Dostawa:</td><td style="padding:6px 12px;text-align:right;">${order.shippingCost === 0 ? "Darmowa" : formatPln(order.shippingCost)}</td></tr>
        <tr><td colspan="2" style="padding:6px 12px;text-align:right;font-weight:bold;">Razem:</td><td style="padding:6px 12px;text-align:right;font-weight:bold;color:#e60000;">${formatPln(order.total)}</td></tr>
      </tfoot>
    </table>`;
}

function emailLayout(storeName: string, title: string, body: string): string {
  return `
  <div style="background:#f9f7f2;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d6;">
      <div style="background:#e60000;padding:20px 24px;">
        <span style="color:#ffffff;font-size:22px;font-weight:bold;">${escapeHtml(storeName)}</span>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e0d6;font-size:12px;color:#6b6b6b;">
        Ta wiadomość została wysłana automatycznie — prosimy na nią nie odpowiadać.
      </div>
    </div>
  </div>`;
}

function shippingBlock(order: OrderEmailData): string {
  return `
    <p style="font-size:14px;color:#6b6b6b;margin:16px 0 4px;">Adres dostawy:</p>
    <p style="font-size:14px;margin:0;">
      ${escapeHtml(order.customerName)}<br/>
      ${escapeHtml(order.shippingAddress)}<br/>
      ${escapeHtml(order.shippingZip)} ${escapeHtml(order.shippingCity)}
    </p>`;
}

// ============================================
// Wiadomości
// ============================================

/** Do klienta — zamówienie przyjęte. */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const settings = await getShopSettings();
  const body = `
    <p>Dziękujemy za zamówienie <strong>${escapeHtml(order.orderNumber)}</strong>!</p>
    <p>Poniżej podsumowanie:</p>
    ${orderItemsTable(order)}
    ${shippingBlock(order)}
    ${
      order.paymentUrl
        ? `<p style="margin:24px 0;"><a href="${escapeHtml(order.paymentUrl)}" style="display:inline-block;background:#e60000;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Dokończ płatność</a></p>`
        : ""
    }
  `;
  await sendMail(
    order.customerEmail,
    `Zamówienie ${order.orderNumber} — przyjęte`,
    emailLayout(settings.storeName, "Zamówienie przyjęte", body)
  );
}

/** Do właścicielki sklepu — nowe zamówienie. */
export async function sendNewOrderNotification(order: OrderEmailData): Promise<void> {
  const settings = await getShopSettings();
  if (!settings.storeEmail) return;
  const body = `
    <p>Nowe zamówienie <strong>${escapeHtml(order.orderNumber)}</strong> od
    ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)}).</p>
    ${orderItemsTable(order)}
    ${shippingBlock(order)}
    <p style="margin-top:16px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/zamowienia" style="color:#e60000;">Otwórz panel zamówień</a>
    </p>
  `;
  await sendMail(
    settings.storeEmail,
    `Nowe zamówienie ${order.orderNumber} (${formatPln(order.total)})`,
    emailLayout(settings.storeName, "Nowe zamówienie w sklepie", body)
  );
}

/** Do klienta — płatność zaksięgowana. */
export async function sendPaymentConfirmedEmail(order: OrderEmailData): Promise<void> {
  const settings = await getShopSettings();
  const body = `
    <p>Otrzymaliśmy płatność za zamówienie <strong>${escapeHtml(order.orderNumber)}</strong>.</p>
    <p>Zabieramy się za przygotowanie Twojej przesyłki — damy znać, gdy zostanie nadana.</p>
    ${orderItemsTable(order)}
  `;
  await sendMail(
    order.customerEmail,
    `Zamówienie ${order.orderNumber} — płatność potwierdzona`,
    emailLayout(settings.storeName, "Płatność potwierdzona", body)
  );
}

/** Do klienta — przesyłka nadana. */
export async function sendOrderShippedEmail(order: OrderEmailData): Promise<void> {
  const settings = await getShopSettings();
  const body = `
    <p>Twoje zamówienie <strong>${escapeHtml(order.orderNumber)}</strong> zostało wysłane!</p>
    ${shippingBlock(order)}
  `;
  await sendMail(
    order.customerEmail,
    `Zamówienie ${order.orderNumber} — wysłane`,
    emailLayout(settings.storeName, "Zamówienie wysłane", body)
  );
}

/** Do klienta — link do ustawienia nowego hasła. */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string | null;
  resetUrl: string;
}): Promise<void> {
  const settings = await getShopSettings();
  const body = `
    <p>Cześć${params.name ? ` ${escapeHtml(params.name)}` : ""}!</p>
    <p>
      Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w sklepie
      ${escapeHtml(settings.storeName)}. Kliknij poniższy przycisk, aby ustawić nowe hasło:
    </p>
    <p style="margin:24px 0;">
      <a href="${params.resetUrl}"
         style="display:inline-block;background:#e60000;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
        Ustaw nowe hasło
      </a>
    </p>
    <p style="font-size:13px;color:#6b6b6b;">
      Link jest ważny przez godzinę i można go użyć tylko raz.
      Jeśli to nie Ty prosiłeś o reset hasła — zignoruj tę wiadomość, Twoje hasło pozostanie bez zmian.
    </p>
    <p style="font-size:12px;color:#6b6b6b;word-break:break-all;">
      Gdyby przycisk nie działał, skopiuj ten adres do przeglądarki:<br/>${params.resetUrl}
    </p>
  `;
  await sendMail(
    params.to,
    "Reset hasła",
    emailLayout(settings.storeName, "Reset hasła", body)
  );
}

/** Do nowego klienta — potwierdzenie własności adresu e-mail. */
export async function sendEmailVerificationEmail(params: {
  to: string;
  name: string | null;
  verificationUrl: string;
}): Promise<void> {
  const settings = await getShopSettings();
  const safeUrl = escapeHtml(params.verificationUrl);
  const body = `
    <p>Cześć${params.name ? ` ${escapeHtml(params.name)}` : ""}!</p>
    <p>Potwierdź adres e-mail i ustaw własne hasło, aby aktywować konto w sklepie ${escapeHtml(settings.storeName)}.</p>
    <p style="margin:24px 0;">
      <a href="${safeUrl}"
         style="display:inline-block;background:#e60000;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
        Potwierdź e-mail i ustaw hasło
      </a>
    </p>
    <p style="font-size:13px;color:#6b6b6b;">
      Link jest ważny przez 24 godziny. Jeśli nie zakładałeś konta, zignoruj tę wiadomość.
    </p>
  `;
  await sendMail(
    params.to,
    "Potwierdź adres e-mail",
    emailLayout(settings.storeName, "Potwierdzenie adresu e-mail", body)
  );
}

/** Mapuje zamówienie z Prismy (z pozycjami) na dane do e-maila. */
export function toOrderEmailData(order: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  subtotal: unknown;
  shippingCost: unknown;
  total: unknown;
  items: Array<{ name: string; quantity: number; price: unknown }>;
}): OrderEmailData {
  return {
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingZip: order.shippingZip,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
}
