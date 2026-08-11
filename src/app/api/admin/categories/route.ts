import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categoryCreateSchema, firstZodMessage } from "@/lib/validation";

// GET /api/admin/categories - Lista kategorii dla admina
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Błąd pobierania kategorii:", error);
    return NextResponse.json(
      { error: "Błąd pobierania kategorii" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Dodawanie kategorii
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Sprawdź czy slug jest unikalny
    const existingCategory = await prisma.category.findUnique({
      where: { slug: input.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Kategoria z tym slugem już istnieje" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        image: input.image || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Błąd tworzenia kategorii:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia kategorii" },
      { status: 500 }
    );
  }
}
