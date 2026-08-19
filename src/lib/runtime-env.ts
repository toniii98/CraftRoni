import "server-only";

export type AppEnvironment = "development" | "staging" | "production";

export function appEnvironment(): AppEnvironment {
  const explicit = process.env.APP_ENV?.trim().toLowerCase();
  if (explicit === "development" || explicit === "staging" || explicit === "production") {
    return explicit;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isProductionEnvironment(): boolean {
  return appEnvironment() === "production";
}

export function isCheckoutEnabled(): boolean {
  const value = process.env.CHECKOUT_ENABLED?.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return !isProductionEnvironment();
}

export function publicAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  if (!raw) {
    if (isProductionEnvironment()) {
      throw new Error("Brak NEXT_PUBLIC_APP_URL w środowisku produkcyjnym");
    }
    return "http://localhost:3000";
  }

  const url = new URL(raw);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_APP_URL musi być samym originem bez ścieżki i danych logowania");
  }
  if (isProductionEnvironment() && (url.protocol !== "https:" || url.hostname === "localhost")) {
    throw new Error("Produkcyjny NEXT_PUBLIC_APP_URL musi używać HTTPS i publicznej domeny");
  }
  return url.origin;
}

export function assertStrongAuthSecret(secret: string | undefined): string {
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_SECRET musi zawierać co najmniej 32 bajty losowych danych");
  }
  return secret;
}

export function assertStrongPaymentAccessSecret(secret: string | undefined): string {
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("PAYMENT_ACCESS_SECRET musi zawierać co najmniej 32 bajty losowych danych");
  }
  return secret;
}
