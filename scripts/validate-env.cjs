/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

function loadLocalEnvironment() {
  const envPath = resolve(process.cwd(), ".env");
  if (typeof process.loadEnvFile === "function" && existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

function parseOrigin(value, name, errors) {
  if (!value) {
    errors.push(`${name} jest wymagane`);
    return null;
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      url.hostname === "localhost"
    ) {
      errors.push(`${name} musi być publicznym originem HTTPS bez ścieżki`);
      return null;
    }
    return url;
  } catch {
    errors.push(`${name} nie jest poprawnym adresem URL`);
    return null;
  }
}

function validateProductionEnvironment(env = process.env) {
  const errors = [];
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

  if (!Number.isInteger(nodeMajor) || nodeMajor < 22) {
    errors.push("produkcja wymaga wspieranej wersji Node.js 22 lub nowszej (zalecane 24 LTS)");
  }
  if (env.NODE_ENV !== "production") errors.push("NODE_ENV musi mieć wartość production");
  if (env.APP_ENV !== "production") errors.push("APP_ENV musi mieć wartość production");

  const authSecret = env.AUTH_SECRET || "";
  if (Buffer.byteLength(authSecret, "utf8") < 32) {
    errors.push("AUTH_SECRET musi zawierać co najmniej 32 bajty losowych danych");
  }
  const paymentAccessSecret = env.PAYMENT_ACCESS_SECRET || "";
  if (Buffer.byteLength(paymentAccessSecret, "utf8") < 32) {
    errors.push("PAYMENT_ACCESS_SECRET musi zawierać co najmniej 32 bajty losowych danych");
  } else if (paymentAccessSecret === authSecret) {
    errors.push("PAYMENT_ACCESS_SECRET musi być inny niż AUTH_SECRET");
  }

  parseOrigin(env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL", errors);

  try {
    const databaseUrl = new URL(env.DATABASE_URL || "");
    if (databaseUrl.protocol !== "mysql:" || !databaseUrl.hostname || !databaseUrl.pathname.slice(1)) {
      errors.push("DATABASE_URL musi wskazywać na konkretną bazę MySQL");
    }
  } catch {
    errors.push("DATABASE_URL nie jest poprawnym adresem MySQL");
  }

  if (!new Set(["true", "false"]).has(env.CHECKOUT_ENABLED)) {
    errors.push("CHECKOUT_ENABLED musi być jawnie ustawione na true albo false");
  }

  if (env.CHECKOUT_ENABLED === "true") {
    if (!/^\d{1,10}$/.test(env.AUTOPAY_SERVICE_ID || "")) {
      errors.push("AUTOPAY_SERVICE_ID jest wymagane dla włączonego checkoutu");
    }
    if (!env.AUTOPAY_SHARED_KEY) {
      errors.push("AUTOPAY_SHARED_KEY jest wymagane dla włączonego checkoutu");
    }
    if (env.AUTOPAY_SANDBOX !== "false") {
      errors.push("AUTOPAY_SANDBOX musi mieć wartość false dla produkcyjnego checkoutu");
    }
    if (!new Set(["sha256", "sha512"]).has((env.AUTOPAY_HASH_ALGORITHM || "").toLowerCase())) {
      errors.push("AUTOPAY_HASH_ALGORITHM musi mieć wartość sha256 albo sha512");
    }
    if (env.AUTOPAY_GATEWAY_URL) {
      try {
        const gateway = new URL(env.AUTOPAY_GATEWAY_URL);
        if (
          gateway.protocol !== "https:" ||
          gateway.hostname !== "pay.autopay.eu" ||
          gateway.username ||
          gateway.password ||
          gateway.pathname !== "/" ||
          gateway.search ||
          gateway.hash
        ) {
          errors.push("AUTOPAY_GATEWAY_URL musi wskazywać na https://pay.autopay.eu");
        }
      } catch {
        errors.push("AUTOPAY_GATEWAY_URL nie jest poprawnym adresem URL");
      }
    }
  }

  const smtpHost = env.SMTP_HOST || "";
  const smtpFrom = env.SMTP_FROM || "";
  const smtpUser = env.SMTP_USER || "";
  const smtpPassword = env.SMTP_PASSWORD || "";
  const smtpConfigured = Boolean(smtpHost || smtpFrom || smtpUser || smtpPassword);
  if (smtpConfigured && (!smtpHost || !smtpFrom)) {
    errors.push("konfiguracja SMTP musi zawierać HOST i FROM");
  }
  if (smtpConfigured && Boolean(smtpUser) !== Boolean(smtpPassword)) {
    errors.push("SMTP_USER i SMTP_PASSWORD muszą występować razem");
  }
  if (smtpConfigured) {
    const smtpPort = Number(env.SMTP_PORT);
    if (smtpPort !== 465 && smtpPort !== 587) {
      errors.push("SMTP_PORT musi mieć wartość 465 albo 587");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Nieprawidłowa konfiguracja produkcyjna:\n- ${errors.join("\n- ")}`);
  }
}

if (require.main === module) {
  loadLocalEnvironment();
  validateProductionEnvironment();
  console.log("Konfiguracja produkcyjna jest kompletna.");
}

module.exports = { loadLocalEnvironment, validateProductionEnvironment };
