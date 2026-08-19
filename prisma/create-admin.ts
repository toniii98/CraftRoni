import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requiredEnvironmentValue(name: "ADMIN_EMAIL" | "ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Brak ${name}. Ustaw tę zmienną w chronionym pliku .env i uruchom komendę ponownie.`);
  }
  return value;
}

async function main() {
  const email = requiredEnvironmentValue("ADMIN_EMAIL").toLowerCase();
  const password = requiredEnvironmentValue("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("ADMIN_EMAIL nie jest poprawnym adresem e-mail.");
  }
  if (email.length > 191) {
    throw new Error("ADMIN_EMAIL jest za długi dla kolumny bazy danych.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD musi mieć co najmniej 12 znaków.");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("ADMIN_PASSWORD nie może przekraczać 72 bajtów UTF-8 (limit bcrypt).");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing && existing.role !== "ADMIN") {
    throw new Error(
      `Konto ${email} już istnieje jako klient. Skrypt nie podnosi uprawnień istniejących kont automatycznie.`
    );
  }

  if (existing) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing.id },
        data: { name, password: passwordHash, emailVerifiedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: existing.id } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: existing.id } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: existing.id } }),
    ]);
    console.log(`Zaktualizowano administratora ${email} i unieważniono jego wcześniejsze sesje.`);
    return;
  }

  await prisma.user.create({
    data: { email, name, password: passwordHash, role: "ADMIN", emailVerifiedAt: new Date() },
  });
  console.log(`Utworzono administratora ${email}. Hasło nie zostało wyświetlone.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
