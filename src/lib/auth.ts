import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

if (!process.env.AUTH_SECRET) {
  // Celowo bez fallbacku: znany publicznie sekret pozwoliłby podrobić token admina.
  throw new Error(
    "Brak zmiennej środowiskowej AUTH_SECRET. Wygeneruj ją poleceniem: openssl rand -base64 32"
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

const COOKIE_NAME = "craftroni-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dni w sekundach

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
  return bcrypt.hash(password, 12);
}

// Weryfikacja hasła
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
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
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
    select: { expiresAt: true },
  });
  if (!dbSession || dbSession.expiresAt < new Date()) {
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
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  await createSession(user.id, user.email, user.role);
  return { success: true };
}

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 godzina

/**
 * Tworzy jednorazowy token resetu hasła. Zwraca surowy token do wysłania
 * mailem — w bazie zapisujemy wyłącznie jego hash.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  // Unieważnij wcześniejsze, niewykorzystane tokeny tego użytkownika
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
    },
  });

  return token;
}

/** Zwraca userId, jeśli token jest ważny (istnieje, nie wygasł, niewykorzystany). */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}

/** Sprawdza ważność tokenu bez jego zużywania (do wyświetlenia formularza). */
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    select: { usedAt: true, expiresAt: true },
  });

  return Boolean(record && !record.usedAt && record.expiresAt > new Date());
}

/** Unieważnia wszystkie sesje użytkownika (po resecie hasła). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

// Unieważnia wszystkie sesje użytkownika poza bieżącą
// (używane po zmianie hasła).
export async function revokeOtherSessions(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  await prisma.session.deleteMany({
    where: {
      userId,
      ...(token ? { NOT: { token: hashToken(token) } } : {}),
    },
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
