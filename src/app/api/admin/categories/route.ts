import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
    const body = await request.json();
    const { name, slug, description, image, isActive, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nazwa i slug są wymagane" },
        { status: 400 }
      );
    }

    // Sprawdź czy slug jest unikalny
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Kategoria z tym slugem już istnieje" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
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
