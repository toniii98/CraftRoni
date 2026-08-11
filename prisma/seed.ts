import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Portfeliki",
    slug: "portfeliki",
    description:
      "Ręcznie szyte portfeliki z tkanin z drugiego obiegu. Posiadają dwie przegródki, mieszczą karty i mają wodoodporną podszewkę.",
    sortOrder: 1,
  },
  {
    name: "Nerki",
    slug: "nerki",
    description:
      "Ręcznie szyte nerki idealne na co dzień. Wykonane są z tkanin z drugiego obiegu oraz odpadów tapicerskich. Posiadają dwie komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
    sortOrder: 2,
  },
  {
    name: "Giga nerki",
    slug: "giga-nerki",
    description:
      "Ręcznie szyte nerki, które pomieszczą małą butelkę z wodą oraz książkę. Wykonane są z odpadów tapicerskich. Posiadają trzy komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
    sortOrder: 3,
  },
] as const;

const settings = [
  { key: "store_name", value: "CraftRoni" },
  { key: "store_email", value: "kontakt@craftroni.pl" },
  { key: "store_phone", value: "" },
  { key: "show_free_shipping_banner", value: "true" },
  { key: "free_shipping_threshold", value: "200" },
  { key: "default_shipping_cost", value: "15" },
] as const;

async function main() {
  console.log("Dodawanie bazowej konfiguracji CraftRoni...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, isActive: true },
      update: {},
    });
  }

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  console.log("Gotowe: dodano brakujące kategorie i ustawienia bazowe.");
  console.log("Seed nie usuwa danych, nie tworzy produktów demo ani administratora.");
}

main()
  .catch((error) => {
    console.error("Nie udało się dodać danych bazowych:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
