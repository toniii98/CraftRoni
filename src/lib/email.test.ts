import assert from "node:assert/strict";
import test from "node:test";
import { smtpConfigFromEnvironment } from "./email";

test("sam domyślny port nie włącza SMTP", () => {
  assert.equal(smtpConfigFromEnvironment({ SMTP_PORT: "587" }), null);
});

test("SMTP 587 wymusza STARTTLS", () => {
  const config = smtpConfigFromEnvironment({
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: "587",
    SMTP_FROM: "CraftRoni <shop@example.test>",
    SMTP_USER: "shop@example.test",
    SMTP_PASSWORD: "secret",
  });

  assert.ok(config);
  assert.equal(config.secure, false);
  assert.equal(config.requireTLS, true);
});

test("SMTP 465 używa TLS od początku połączenia", () => {
  const config = smtpConfigFromEnvironment({
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: "465",
    SMTP_FROM: "shop@example.test",
  });

  assert.ok(config);
  assert.equal(config.secure, true);
  assert.equal(config.requireTLS, false);
});

test("niepełna lub niebezpieczna konfiguracja SMTP jest odrzucana", () => {
  assert.throws(
    () =>
      smtpConfigFromEnvironment({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "587",
        SMTP_FROM: "shop@example.test",
        SMTP_USER: "shop@example.test",
      }),
    /SMTP_USER i SMTP_PASSWORD/
  );
  assert.throws(
    () =>
      smtpConfigFromEnvironment({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "25",
        SMTP_FROM: "shop@example.test",
      }),
    /465 albo 587/
  );
  assert.throws(
    () =>
      smtpConfigFromEnvironment({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "587",
        SMTP_FROM: "shop@example.test\r\nBcc: attacker@example.test",
      }),
    /nowej linii/
  );
});
