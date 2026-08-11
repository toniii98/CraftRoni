import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Rozpoczynam seedowanie bazy danych...\n");

  // Wyczyść istniejące dane (w odwrotnej kolejności ze względu na relacje)
  console.log("🗑️  Czyszczenie istniejących danych...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Tworzenie kategorii
  console.log("📁 Tworzenie kategorii...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Portfeliki",
        slug: "portfeliki",
        description: "Ręcznie szyte portfeliki z tkanin z drugiego obiegu. Posiadają dwie przegródki, mieszczą karty i mają wodoodporną podszewkę.",
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Nerki",
        slug: "nerki",
        description: "Ręcznie szyte nerki idealne na co dzień. Wykonane są z tkanin z drugiego obiegu oraz odpadów tapicerskich. Posiadają dwie komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Giga nerki",
        slug: "giga-nerki",
        description: "Ręcznie szyte nerki, które pomieszczą małą butelkę z wodą oraz książkę. Wykonane są z odpadów tapicerskich. Posiadają trzy komory, wodoodporną podszewkę, karabińczyk na gumce oraz regulowany pasek.",
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);

  const [portfeliki, nerki, gigaNerki] = categories;

  console.log(`   ✓ Utworzono ${categories.length} kategorii`);

  // Produkty demonstracyjne — do podmiany na prawdziwe w panelu admina
  console.log("📦 Tworzenie produktów...");

  const products = [
    // Portfeliki
    {
      name: "Portfelik na zatrzask — bordowy",
      slug: "portfelik-zatrzask-bordowy",
      description:
        "Ręcznie szyty portfelik zapinany na zatrzask. Dwie przegródki na karty i kieszonka na monety. Kompaktowy — mieści się w każdej torebce i kieszeni.",
      price: 89,
      salePrice: null,
      sku: "POR-001",
      stock: 5,
      isFeatured: true,
      categoryId: portfeliki.id,
    },
    {
      name: "Mini portfelik na karty",
      slug: "mini-portfelik-na-karty",
      description:
        "Najmniejszy z rodziny — mini portfelik na karty płatnicze i dowód. Ręcznie szyty z mocnej tkaniny, zapinany na suwak.",
      price: 59,
      salePrice: 49,
      sku: "POR-002",
      stock: 8,
      isFeatured: false,
      categoryId: portfeliki.id,
    },
    // Nerki
    {
      name: "Nerka codzienna — czarna",
      slug: "nerka-codzienna-czarna",
      description:
        "Klasyczna, ręcznie szyta nerka na co dzień. Główna komora na suwak, kieszonka wewnętrzna na drobiazgi, regulowany pasek. Uszyta z wytrzymałej tkaniny.",
      price: 129,
      salePrice: null,
      sku: "NER-001",
      stock: 6,
      isFeatured: true,
      categoryId: nerki.id,
    },
    {
      name: "Nerka we wzory",
      slug: "nerka-we-wzory",
      description:
        "Nerka, która nie da się nie zauważyć — ręcznie szyta z tkanin we wzory dostępne w limitowanych seriach. Każda sztuka jest niepowtarzalna.",
      price: 139,
      salePrice: null,
      sku: "NER-002",
      stock: 4,
      isFeatured: true,
      categoryId: nerki.id,
    },
    // Giga nerki
    {
      name: "Giga nerka podróżna",
      slug: "giga-nerka-podrozna",
      description:
        "Giga nerka do zadań specjalnych: mieści portfel, telefon, powerbank, klucze i jeszcze zostaje miejsce. Szeroki, regulowany pasek i podwójne szwy.",
      price: 189,
      salePrice: null,
      sku: "GIG-001",
      stock: 3,
      isFeatured: true,
      categoryId: gigaNerki.id,
    },
    {
      name: "Giga nerka XXL",
      slug: "giga-nerka-xxl",
      description:
        "Największa nerka w ofercie — wersja XXL z dodatkową przednią kieszenią. Gdy zwykła nerka to za mało, a plecak to za dużo.",
      price: 219,
      salePrice: 199,
      sku: "GIG-002",
      stock: 2,
      isFeatured: true,
      categoryId: gigaNerki.id,
    },
  ];

  // Zdjęcia dodaje się przez panel admina (upload) — seed nie tworzy obrazków.
  for (const productData of products) {
    const createdProduct = await prisma.product.create({
      data: productData,
    });
    console.log(`   ✓ ${createdProduct.name}`);
  }

  console.log(`   ✓ Utworzono ${products.length} produktów`);

  // Tworzenie użytkownika admin
  console.log("👤 Tworzenie użytkownika admin...");
  const isProduction = process.env.NODE_ENV === "production";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@craftroni.pl";
  const generatedPassword = randomBytes(9).toString("base64url");
  // Dev: stałe hasło admin123. Produkcja: ADMIN_PASSWORD z .env albo losowe.
  const adminPassword =
    process.env.ADMIN_PASSWORD || (isProduction ? generatedPassword : "admin123");

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Administrator",
      password: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
  });
  console.log(`   ✓ Admin: ${admin.email}`);

  // Tworzenie ustawień domyślnych (istniejące wartości zostają — mogły być
  // zmienione w panelu admina)
  console.log("⚙️  Tworzenie ustawień...");
  await prisma.setting.createMany({
    skipDuplicates: true,
    data: [
      { key: "store_name", value: "CraftRoni" },
      { key: "store_email", value: "kontakt@craftroni.pl" },
      { key: "store_phone", value: "+48 123 456 789" },
      { key: "free_shipping_threshold", value: "200" },
      { key: "default_shipping_cost", value: "15" },
      { key: "currency", value: "PLN" },
    ],
  });
  console.log("   ✓ Ustawienia domyślne utworzone");

  console.log("\n✅ Seedowanie zakończone pomyślnie!");
  console.log("\n📊 Podsumowanie:");
  console.log(`   - Kategorii: ${categories.length}`);
  console.log(`   - Produktów: ${products.length} (demonstracyjne — podmień w panelu)`);
  console.log(`   - Użytkowników: 1 (admin)`);
  console.log("\n🔐 Dane logowania admina:");
  console.log(`   Email: ${adminEmail}`);
  if (process.env.ADMIN_PASSWORD) {
    console.log("   Hasło: (wartość ADMIN_PASSWORD z .env)");
  } else if (isProduction) {
    console.log(`   Hasło (wygenerowane, zapisz je!): ${generatedPassword}`);
  } else {
    console.log("   Hasło (dev): admin123");
  }
}

main()
  .catch((e) => {
    console.error("❌ Błąd podczas seedowania:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
