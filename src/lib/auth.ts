import { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { normalizeEmail } from "./utils";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "craftroni-secret-key-change-in-production"
);

const COOKIE_NAME = "craftroni-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dni w sekundach

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  expiresAt: Date;
}

export interface RegisterCustomerInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: Role;
  };
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
      role: payload.role as Role,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}

async function linkGuestOrdersToUser(userId: string, email: string) {
  await prisma.order.updateMany({
    where: {
      userId: null,
      normalizedCustomerEmail: normalizeEmail(email),
      OR: [{ matchedUserId: null }, { matchedUserId: userId }],
    },
    data: {
      matchedUserId: userId,
      accountLinkStatus: "MATCHED_BY_EMAIL",
    },
  });
}

// Tworzenie sesji (zapisanie w cookies)
export async function createSession(userId: string, email: string, role: Role) {
  const token = await createToken({ userId, email, role });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

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

  if (new Date() > payload.expiresAt) {
    await deleteSession();
    return null;
  }

  const existingSession = await prisma.session.findUnique({
    where: { token },
    select: { id: true, expiresAt: true },
  });

  if (!existingSession || new Date() > existingSession.expiresAt) {
    await deleteSession();
    return null;
  }

  return payload;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

// Usuwanie sesji (wylogowanie)
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}

// Logowanie użytkownika
export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { emailNormalized: normalizeEmail(email) },
  });

  if (!user) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  await createSession(user.id, user.email, user.role);
  await linkGuestOrdersToUser(user.id, user.email);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<AuthResult> {
  const email = input.email.trim();
  const emailNormalized = normalizeEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: { emailNormalized },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "Konto z tym adresem email już istnieje" };
  }

  const hashedPassword = await hashPassword(input.password);
  const fullName = input.fullName.trim();

  const user = await prisma.user.create({
    data: {
      email,
      emailNormalized,
      password: hashedPassword,
      name: fullName,
      role: "CUSTOMER",
      profile: {
        create: {
          fullName,
          phone: input.phone?.trim() || null,
        },
      },
    },
  });

  await createSession(user.id, user.email, user.role);
  await linkGuestOrdersToUser(user.id, user.email);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

// Sprawdzenie czy użytkownik jest adminem
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function requireAuth(): Promise<SessionPayload | null> {
  return getSession();
}
