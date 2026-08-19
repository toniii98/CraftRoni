import "dotenv/config";
import { releaseExpiredReservations } from "../src/lib/order-state";
import prisma from "../src/lib/prisma";

async function main() {
  let total = 0;
  while (true) {
    const released = await releaseExpiredReservations(100);
    total += released;
    if (released < 100) break;
  }
  const now = new Date();
  const [sessions, resetTokens, verificationTokens] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);
  console.log(`[orders:expire] Zwolniono rezerwacje: ${total}`);
  console.log(
    `[orders:expire] Usunięto wygasłe sesje/tokeny: ${sessions.count}/${resetTokens.count}/${verificationTokens.count}`
  );
}

main()
  .catch((error) => {
    console.error("[orders:expire] Błąd wygaszania rezerwacji", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
