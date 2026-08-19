import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { TERMS_VERSION } from "./legal";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { isBcryptPasswordLengthValid } from "./validation";
import { assertStrongAuthSecret } from "./runtime-env";

// Celowo bez fallbacku: znany lub zbyt krótki sekret pozwoliłby podrobić sesję.
const JWT_SECRET = new TextEncoder().encode(assertStrongAuthSecret(process.env.AUTH_SECRET));

const COOKIE_NAME = "craftroni-session";
export const EMAIL_VERIFICATION_COOKIE = "craftroni-email-verification";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dni w sekundach
// Stały koszt porównania także dla nieistniejącego adresu ogranicza enumerację
// kont przez pomiar czasu odpowiedzi. Hash nie odpowiada żadnemu kontu.
const DUMMY_PASSWORD_HASH = "$2b$12$3/Z3iW5IG4nkBePmwc9AdOIomfgzrldwq3IQK71sDj9YKz6Frwc.S";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  expiresAt: Date;
}

// W bazie trzymamy hash tokenu, nie sam token:
// 1) JWT (~300 znaków) nie mieści się w kolumnie VARCHAR(191),
// 2) wyciek bazy nie ujawnia działających tokenów sesji.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Hashowanie hasła
export async function hashPassword(password: string): Promise<string> {
  if (!isBcryptPasswordLengthValid(password)) {
    throw new Error("Hasło przekracza limit 72 bajtów bcrypt");
  }
  return bcrypt.hash(password, 12);
}

// Weryfikacja hasła
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!isBcryptPasswordLengthValid(password)) return false;
  return bcrypt.compare(password, hashedPassword);
}

// Tworzenie tokenu JWT
export async function createToken(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
  
  return new SignJWT({ ...payload, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);
}

// Weryfikacja tokenu JWT
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "ADMIN" | "CUSTOMER",
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}

// Tworzenie sesji (zapisanie w cookies)
export async function createSession(userId: string, email: string, role: "ADMIN" | "CUSTOMER") {
  const token = await createToken({ userId, email, role });
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  // Zapisz sesję w bazie
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
  await prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt,
    },
  });

  // Sprzątanie wygasłych sesji, żeby tabela nie rosła w nieskończoność
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return token;
}

// Pobieranie aktualnej sesji
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Sprawdź czy sesja nie wygasła
  if (new Date() > payload.expiresAt) {
    await deleteSession();
    return null;
  }

  // Sesja musi istnieć w bazie — dzięki temu wylogowanie natychmiast
  // unieważnia token (sam JWT byłby ważny do końca terminu).
  const dbSession = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { email: true, role: true, emailVerifiedAt: true } },
    },
  });
  if (
    !dbSession ||
    dbSession.expiresAt < new Date() ||
    dbSession.user.email !== payload.email ||
    dbSession.user.role !== payload.role ||
    (dbSession.user.role === "CUSTOMER" && !dbSession.user.emailVerifiedAt)
  ) {
    await deleteSession();
    return null;
  }

  return payload;
}

// Usuwanie sesji (wylogowanie)
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (token) {
    // Usuń sesję z bazy
    await prisma.session.deleteMany({
      where: { token: hashToken(token) },
    });
  }
  
  cookieStore.delete(COOKIE_NAME);
}

// Logowanie użytkownika
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }
  if (user.role === "CUSTOMER" && !user.emailVerifiedAt) {
    return { success: false, error: "Najpierw potwierdź adres email linkiem rejestracyjnym" };
  }

  await createSession(user.id, user.email, user.role);
  return { success: true };
}

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 godzina
const EMAIL_VERIFICATION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 godziny

export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_DURATION_MS);

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    });
    await tx.emailVerificationToken.create({
      data: { userId, token: tokenHash, expiresAt },
    });
  });
  return token;
}

export async function verifyEmailWithToken(
  token: string,
  password: string,
  name: string,
  termsAccepted: true
): Promise<boolean> {
  if (termsAccepted !== true) return false;
  const passwordHash = await hashPassword(password);
  const tokenHash = hashToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.emailVerificationToken.findUnique({
      where: { token: tokenHash },
      select: { id: true, userId: true },
    });
    if (!record) return false;

    const consumed = await tx.emailVerificationToken.deleteMany({
      where: { id: record.id, token: tokenHash, expiresAt: { gt: now } },
    });
    if (consumed.count !== 1) return false;

    const activated = await tx.user.updateMany({
      where: { id: record.userId, emailVerifiedAt: null },
      data: {
        password: passwordHash,
        name,
        emailVerifiedAt: now,
        termsAcceptedAt: now,
        termsVersion: TERMS_VERSION,
      },
    });
    if (activated.count !== 1) return false;
    await tx.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    return true;
  });
}

/**
 * Tworzy jednorazowy token resetu hasła. Zwraca surowy token do wysłania
 * mailem — w bazie zapisujemy wyłącznie jego hash.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS);

  // userId jest unikalny: nawet równoległe żądania pozostawiają dokładnie jeden
  // aktywny rekord. Ostatni zapis unieważnia wszystkie wcześniejsze linki.
  await prisma.passwordResetToken.upsert({
    where: { userId },
    create: { userId, token: tokenHash, expiresAt },
    update: {
      token: tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    },
  });

  return token;
}

/**
 * Atomowo zużywa token, zmienia hasło i unieważnia wszystkie sesje.
 * Gdy którykolwiek zapis się nie powiedzie, token pozostaje niewykorzystany.
 */
export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  const tokenHash = hashToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({
      where: { token: tokenHash },
      select: { id: true, userId: true },
    });
    if (!record) return false;

    // updateMany pełni rolę compare-and-swap: dwie równoległe próby nie mogą
    // zużyć tego samego tokenu.
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { password: passwordHash },
    });
    await tx.session.deleteMany({ where: { userId: record.userId } });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    });

    return true;
  });
}

/** Sprawdza ważność tokenu bez jego zużywania (do wyświetlenia formularza). */
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    select: { usedAt: true, expiresAt: true },
  });

  return Boolean(record && !record.usedAt && record.expiresAt > new Date());
}

export type ChangePasswordResult = "changed" | "not-found" | "invalid-current" | "conflict";

/** Zmienia hasło i unieważnia pozostałe sesje w jednej transakcji. */
export async function changePasswordAndRevokeOtherSessions(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) return "not-found";
  if (!(await verifyPassword(currentPassword, user.password))) return "invalid-current";

  const passwordHash = await hashPassword(newPassword);
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return prisma.$transaction(async (tx) => {
    // Hash starego hasła jest warunkiem CAS. Jeśli równoległa operacja zdążyła
    // już zmienić hasło, nie nadpisujemy jej wyniku.
    const updated = await tx.user.updateMany({
      where: { id: userId, password: user.password },
      data: { password: passwordHash },
    });
    if (updated.count !== 1) return "conflict";

    await tx.session.deleteMany({
      where: {
        userId,
        ...(token ? { NOT: { token: hashToken(token) } } : {}),
      },
    });
    await tx.passwordResetToken.deleteMany({ where: { userId } });

    return "changed";
  });
}

// Sprawdzenie czy użytkownik jest adminem
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  
  return session;
}
