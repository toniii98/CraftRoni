import assert from "node:assert/strict";
import test from "node:test";
import {
  changePasswordSchema,
  emailVerificationConfirmSchema,
  emailVerificationSchema,
  isBcryptPasswordLengthValid,
  passwordResetConfirmSchema,
  passwordSchema,
  registerSchema,
} from "./validation";

test("limit bcrypt jest liczony w bajtach UTF-8", () => {
  assert.equal(isBcryptPasswordLengthValid("a".repeat(72)), true);
  assert.equal(isBcryptPasswordLengthValid("a".repeat(73)), false);
  assert.equal(isBcryptPasswordLengthValid("ą".repeat(36)), true);
  assert.equal(isBcryptPasswordLengthValid("ą".repeat(37)), false);
});

test("token potwierdzenia e-maila ma wymagany rozmiar", () => {
  assert.equal(emailVerificationSchema.safeParse({ token: "a".repeat(43) }).success, true);
  assert.equal(emailVerificationSchema.safeParse({ token: "short" }).success, false);
  assert.equal(emailVerificationSchema.safeParse({ token: "a".repeat(201) }).success, false);
});

test("wspólny schemat hasła odrzuca ponad 72 bajty", () => {
  assert.equal(passwordSchema.safeParse("a".repeat(72)).success, true);
  assert.equal(passwordSchema.safeParse("ą".repeat(37)).success, false);
});

test("aktywacja e-mail, reset i zmiana hasła dziedziczą limit bcrypt", () => {
  const tooLong = "ą".repeat(37);

  assert.equal(
    emailVerificationConfirmSchema.safeParse({
      password: tooLong,
      name: "Test User",
      termsAccepted: true,
    }).success,
    false
  );
  assert.equal(
    passwordResetConfirmSchema.safeParse({ token: "valid-token", password: tooLong }).success,
    false
  );
  assert.equal(
    changePasswordSchema.safeParse({ currentPassword: tooLong, newPassword: "valid-pass-123" })
      .success,
    false
  );
});

test("rejestracja nie przyjmuje hasła przed potwierdzeniem własności e-maila", () => {
  const parsed = registerSchema.parse({
    email: "user@example.test",
    password: "attacker-controlled-password",
    name: "Test User",
    termsAccepted: true,
  });
  assert.equal("password" in parsed, false);
  assert.equal("name" in parsed, false);
  assert.equal("termsAccepted" in parsed, false);
});

test("nazwa i zgoda są wymagane dopiero przy aktywacji konta", () => {
  assert.equal(
    emailVerificationConfirmSchema.safeParse({
      password: "valid-pass-123",
      name: "Test User",
      termsAccepted: true,
    }).success,
    true
  );
  assert.equal(
    emailVerificationConfirmSchema.safeParse({
      password: "valid-pass-123",
      name: "Test User",
      termsAccepted: false,
    }).success,
    false
  );
});
