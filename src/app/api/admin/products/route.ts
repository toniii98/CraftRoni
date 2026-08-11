import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productCreateSchema, firstZodMessage } from "@/lib/validation";

// GET /api/admin/products - Lista produktów dla admina
export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Błąd pobierania produktów:", error);
    return NextResponse.json(
      { error: "Błąd pobierania produktów" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Dodawanie produktu
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    if (input.salePrice != null && input.salePrice >= input.price) {
      return NextResponse.json(
        { error: "Cena promocyjna musi być niższa od ceny podstawowej" },
        { status: 400 }
      );
    }

    // Sprawdź czy slug jest unikalny
    const existingProduct = await prisma.product.findUnique({
      where: { slug: input.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Produkt z tym slugem już istnieje" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Wybrana kategoria nie istnieje" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        price: input.price,
        salePrice: input.salePrice ?? null,
        sku: input.sku || null,
        stock: input.stock,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false,
        images: input.images?.length
          ? {
              create: input.images.map((img, index) => ({
                url: img.url,
                alt: img.alt || input.name,
                isPrimary: index === 0,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Błąd tworzenia produktu:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia produktu" },
      { status: 500 }
    );
  }
}
