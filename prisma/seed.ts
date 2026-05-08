import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "../src/lib/utils";

const prisma = new PrismaClient();

const demoPasswordHash = "$2b$12$EiI8mucsA91iVT9owxaJYOd7MB4i8i12INpmEAl5lytMmfJH7EqRa"; // admin123

async function main() {
  console.log("🌱 Rozpoczynam seedowanie bazy danych...\n");

  // Wyczyść istniejące dane (w odwrotnej kolejności ze względu na relacje)
  console.log("🗑️  Czyszczenie istniejących danych...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customerProfile.deleteMany();
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
        name: "Biżuteria",
        slug: "bizuteria",
        description: "Ręcznie robiona biżuteria z naturalnych materiałów",
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Ceramika",
        slug: "ceramika",
        description: "Unikalne wyroby ceramiczne tworzone tradycyjnymi metodami",
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Tekstylia",
        slug: "tekstylia",
        description: "Tkaniny, koce i dekoracje wykonane ręcznie",
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Drewno",
        slug: "drewno",
        description: "Wyroby z drewna - od dekoracji po praktyczne przedmioty",
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Świece i aromaty",
        slug: "swiece-aromaty",
        description: "Naturalne świece i produkty aromatyczne",
        sortOrder: 5,
        isActive: true,
      },
    }),
  ]);

  const [bizuteria, ceramika, tekstylia, drewno, swiece] = categories;

  console.log(`   ✓ Utworzono ${categories.length} kategorii`);

  // Tworzenie produktów
  console.log("📦 Tworzenie produktów...");

  const products = [
    {
      name: "Kolczyki z bursztynem bałtyckim",
      slug: "kolczyki-bursztyn-baltycki",
      description:
        "Eleganckie kolczyki wykonane ze srebra próby 925 z naturalnymi bursztynami bałtyckimi. Każda para jest unikalna ze względu na niepowtarzalny wzór bursztynu. Idealne na prezent lub jako dodatek do codziennej stylizacji.",
      price: 189,
      salePrice: 159,
      sku: "BIZ-KOL-001",
      stock: 15,
      isFeatured: true,
      categoryId: bizuteria.id,
      images: [
        { url: "/images/products/kolczyki-bursztyn-1.jpg", alt: "Kolczyki z bursztynem - widok z przodu", isPrimary: true, sortOrder: 0 },
        { url: "/images/products/kolczyki-bursztyn-2.jpg", alt: "Kolczyki z bursztynem - detal", isPrimary: false, sortOrder: 1 },
      ],
    },
    {
      name: "Bransoletka pleciona z koralikami",
      slug: "bransoletka-pleciona-koraliki",
      description:
        "Ręcznie pleciona bransoletka z naturalnych materiałów ozdobiona kolorowymi koralikami. Regulowana długość pasuje na większość nadgarstków.",
      price: 65,
      salePrice: null,
      sku: "BIZ-BRA-001",
      stock: 30,
      isFeatured: false,
      categoryId: bizuteria.id,
      images: [{ url: "/images/products/bransoletka-1.jpg", alt: "Bransoletka pleciona", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Naszyjnik z kwarcem różowym",
      slug: "naszyjnik-kwarc-rozowy",
      description:
        "Delikatny naszyjnik z naturalnym kwarcem różowym zawieszonym na srebrnym łańcuszku. Kwarc różowy symbolizuje miłość i harmonię.",
      price: 145,
      salePrice: null,
      sku: "BIZ-NAS-001",
      stock: 20,
      isFeatured: true,
      categoryId: bizuteria.id,
      images: [{ url: "/images/products/naszyjnik-kwarc-1.jpg", alt: "Naszyjnik z kwarcem różowym", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Kubek ceramiczny ręcznie malowany",
      slug: "kubek-ceramiczny-malowany",
      description:
        "Kubek o pojemności 350ml wykonany z ceramiki i ręcznie malowany tradycyjnymi polskimi wzorami. Można myć w zmywarce. Każdy kubek jest unikalny.",
      price: 75,
      salePrice: null,
      sku: "CER-KUB-001",
      stock: 25,
      isFeatured: true,
      categoryId: ceramika.id,
      images: [
        { url: "/images/products/kubek-ceramiczny-1.jpg", alt: "Kubek ceramiczny malowany", isPrimary: true, sortOrder: 0 },
        { url: "/images/products/kubek-ceramiczny-2.jpg", alt: "Kubek ceramiczny - wzór", isPrimary: false, sortOrder: 1 },
      ],
    },
    {
      name: "Miska na owoce - liść",
      slug: "miska-owoce-lisc",
      description:
        "Dekoracyjna miska w kształcie liścia, idealna na owoce lub jako element wystroju. Ręcznie formowana i szkliwiona.",
      price: 120,
      salePrice: 99,
      sku: "CER-MIS-001",
      stock: 10,
      isFeatured: false,
      categoryId: ceramika.id,
      images: [{ url: "/images/products/miska-lisc-1.jpg", alt: "Miska ceramiczna liść", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Wazon ceramiczny artystyczny",
      slug: "wazon-ceramiczny-artystyczny",
      description:
        "Elegancki wazon o organicznych kształtach. Wysokość 25cm. Idealny do suszonych kwiatów i traw ozdobnych.",
      price: 180,
      salePrice: null,
      sku: "CER-WAZ-001",
      stock: 8,
      isFeatured: true,
      categoryId: ceramika.id,
      images: [{ url: "/images/products/wazon-1.jpg", alt: "Wazon ceramiczny", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Poduszka dekoracyjna haftowana",
      slug: "poduszka-haftowana",
      description:
        "Lniana poduszka dekoracyjna z ręcznym haftem w ludowe wzory. Wymiary 45x45cm. Wypełnienie z antyalergicznego włókna.",
      price: 130,
      salePrice: null,
      sku: "TEK-POD-001",
      stock: 20,
      isFeatured: false,
      categoryId: tekstylia.id,
      images: [{ url: "/images/products/poduszka-1.jpg", alt: "Poduszka haftowana", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Koc wełniany w kratę",
      slug: "koc-welnany-krata",
      description:
        "Miękki koc z naturalnej wełny owczej w klasyczną kratę. Wymiary 150x200cm. Idealny na chłodne wieczory.",
      price: 350,
      salePrice: 299,
      sku: "TEK-KOC-001",
      stock: 12,
      isFeatured: true,
      categoryId: tekstylia.id,
      images: [{ url: "/images/products/koc-welnany-1.jpg", alt: "Koc wełniany", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Bieżnik lniany naturalny",
      slug: "bieznik-lniany",
      description:
        "Elegancki bieżnik z naturalnego lnu z delikatnym haftem na brzegach. Wymiary 40x140cm.",
      price: 95,
      salePrice: null,
      sku: "TEK-BIE-001",
      stock: 18,
      isFeatured: false,
      categoryId: tekstylia.id,
      images: [{ url: "/images/products/bieznik-1.jpg", alt: "Bieżnik lniany", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Deska do krojenia dębowa",
      slug: "deska-krojenia-dab",
      description:
        "Solidna deska do krojenia wykonana z polskiego drewna dębowego. Olejowana naturalnym olejem. Wymiary 40x25cm.",
      price: 140,
      salePrice: null,
      sku: "DRE-DES-001",
      stock: 15,
      isFeatured: true,
      categoryId: drewno.id,
      images: [{ url: "/images/products/deska-dab-1.jpg", alt: "Deska dębowa", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Szkatułka rzeźbiona",
      slug: "szkatulka-rzezbiona",
      description:
        "Ręcznie rzeźbiona szkatułka z drewna lipowego z tradycyjnymi polskimi motywami. Idealna na biżuterię i drobiazgi.",
      price: 220,
      salePrice: 189,
      sku: "DRE-SZK-001",
      stock: 6,
      isFeatured: true,
      categoryId: drewno.id,
      images: [{ url: "/images/products/szkatulka-1.jpg", alt: "Szkatułka rzeźbiona", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Łyżki drewniane zestaw",
      slug: "lyzki-drewniane-zestaw",
      description:
        "Zestaw 3 łyżek kuchennych wyrzeźbionych z drewna bukowego. Naturalne, bezpieczne przy kontakcie z żywnością.",
      price: 55,
      salePrice: null,
      sku: "DRE-LYZ-001",
      stock: 25,
      isFeatured: false,
      categoryId: drewno.id,
      images: [{ url: "/images/products/lyzki-1.jpg", alt: "Łyżki drewniane", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Świeca sojowa - leśny mech",
      slug: "swieca-sojowa-lesny-mech",
      description:
        "Naturalna świeca z wosku sojowego o zapachu leśnego mchu i świeżej zieleni. Czas palenia około 40 godzin.",
      price: 65,
      salePrice: null,
      sku: "SWI-SOJ-001",
      stock: 35,
      isFeatured: true,
      categoryId: swiece.id,
      images: [{ url: "/images/products/swieca-mech-1.jpg", alt: "Świeca sojowa leśny mech", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Świeca sojowa - lawenda",
      slug: "swieca-sojowa-lawenda",
      description:
        "Relaksująca świeca o zapachu prawdziwej lawendy. Wykonana z naturalnego wosku sojowego. Czas palenia około 40 godzin.",
      price: 65,
      salePrice: null,
      sku: "SWI-SOJ-002",
      stock: 30,
      isFeatured: false,
      categoryId: swiece.id,
      images: [{ url: "/images/products/swieca-lawenda-1.jpg", alt: "Świeca sojowa lawenda", isPrimary: true, sortOrder: 0 }],
    },
    {
      name: "Zestaw świec bożonarodzeniowych",
      slug: "zestaw-swiec-bozonarodzeniowy",
      description:
        "Zestaw 4 świec o świątecznych zapachach: cynamon, pomarańcza, piernik, choinka. Idealne na prezent.",
      price: 120,
      salePrice: 99,
      sku: "SWI-ZES-001",
      stock: 20,
      isFeatured: true,
      categoryId: swiece.id,
      images: [{ url: "/images/products/swiece-zestaw-1.jpg", alt: "Zestaw świec świątecznych", isPrimary: true, sortOrder: 0 }],
    },
  ];

  for (const productData of products) {
    const { images, ...product } = productData;
    const createdProduct = await prisma.product.create({
      data: {
        ...product,
        images: {
          create: images,
        },
      },
    });
    console.log(`   ✓ ${createdProduct.name}`);
  }

  console.log(`   ✓ Utworzono ${products.length} produktów`);

  console.log("👤 Tworzenie użytkowników...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@craftroni.pl",
      emailNormalized: normalizeEmail("admin@craftroni.pl"),
      name: "Administrator",
      password: demoPasswordHash,
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "anna@craftroni.pl",
      emailNormalized: normalizeEmail("anna@craftroni.pl"),
      name: "Anna Kowalska",
      password: demoPasswordHash,
      role: "CUSTOMER",
      profile: {
        create: {
          fullName: "Anna Kowalska",
          phone: "+48 501 234 567",
        },
      },
      addresses: {
        create: {
          label: "Dom",
          recipientName: "Anna Kowalska",
          phone: "+48 501 234 567",
          line1: "ul. Kwiatowa 15/7",
          city: "Warszawa",
          postalCode: "00-123",
          countryCode: "PL",
          isDefault: true,
        },
      },
    },
  });

  console.log(`   ✓ Admin: ${admin.email}`);
  console.log(`   ✓ Klient: ${customer.email}`);

  console.log("⚙️  Tworzenie ustawień...");
  await prisma.setting.createMany({
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
  console.log(`   - Produktów: ${products.length}`);
  console.log("   - Użytkowników: 2 (admin + klient)");
  console.log("\n🔐 Dane logowania testowe:");
  console.log("   Admin: admin@craftroni.pl / admin123");
  console.log("   Klient: anna@craftroni.pl / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Błąd podczas seedowania:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
