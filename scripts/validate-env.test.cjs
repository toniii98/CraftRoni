/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { validateProductionEnvironment } = require("./validate-env.cjs");

const valid = {
  NODE_ENV: "production",
  APP_ENV: "production",
  CHECKOUT_ENABLED: "false",
  AUTH_SECRET: "unit-test-secret-with-at-least-32-bytes",
  PAYMENT_ACCESS_SECRET: "another-unit-test-secret-at-least-32-bytes",
  NEXT_PUBLIC_APP_URL: "https://shop.example.test",
  DATABASE_URL: "mysql://user:password@db.example.test:3306/shop",
};

test("akceptuje produkcję z jawnie wyłączonym checkoutem", () => {
  assert.doesNotThrow(() => validateProductionEnvironment(valid));
});

test("włączony checkout wymaga produkcyjnej konfiguracji Autopay", () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        ...valid,
        CHECKOUT_ENABLED: "true",
        AUTOPAY_SERVICE_ID: "2",
        AUTOPAY_SHARED_KEY: "secret",
        AUTOPAY_HASH_ALGORITHM: "sha256",
        AUTOPAY_SANDBOX: "true",
      }),
    /AUTOPAY_SANDBOX/
  );
});

test("produkcja wymaga osobnego sekretu linków płatniczych", () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        ...valid,
        CHECKOUT_ENABLED: "false",
        PAYMENT_ACCESS_SECRET: valid.AUTH_SECRET,
      }),
    /PAYMENT_ACCESS_SECRET/
  );
});

test("odrzuca słaby sekret i niepełne SMTP", () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        ...valid,
        AUTH_SECRET: "short",
        SMTP_HOST: "smtp.example.test",
      }),
    /AUTH_SECRET[\s\S]*SMTP/
  );
});
