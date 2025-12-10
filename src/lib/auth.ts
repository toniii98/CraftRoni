import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "craftroni-secret-key-change-in-production"
);

const COOKIE_NAME = "craftroni-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dni w sekundach

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  expiresAt: Date;
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
      token,
      expiresAt,
    },
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
  
  return payload;
}

// Usuwanie sesji (wylogowanie)
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (token) {
    // Usuń sesję z bazy
    await prisma.session.deleteMany({
      where: { token },
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
    where: { email },
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

// Sprawdzenie czy użytkownik jest adminem
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  
  return session;
}
