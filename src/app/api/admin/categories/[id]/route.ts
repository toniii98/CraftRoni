import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categoryUpdateSchema, firstZodMessage } from "@/lib/validation";
import { deleteUploadedImages } from "@/lib/uploads";

// GET - pobierz pojedynczą kategorię
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Brak autoryzacji" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategoria nie znaleziona" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Błąd pobierania kategorii:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}

// PUT - aktualizuj kategorię
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Brak autoryzacji" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Sprawdź czy slug jest unikalny (poza tą kategorią)
    if (input.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug: input.slug,
          id: { not: id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: "Kategoria z takim slugiem już istnieje" },
          { status: 400 }
        );
      }
    }

    // Poprzednie zdjęcie — usuniemy plik, jeśli zostało podmienione
    const before = await prisma.category.findUnique({
      where: { id },
      select: { image: true },
    });

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.slug && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.image !== undefined && { image: input.image }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });

    if (before?.image && before.image !== category.image) {
      await deleteUploadedImages([before.image]);
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Błąd aktualizacji kategorii:", error);

    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Kategoria nie znaleziona" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}

// DELETE - usuń kategorię
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Brak autoryzacji" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Sprawdź czy kategoria ma produkty
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Nie można usunąć kategorii ponieważ zawiera ${productCount} produktów` },
        { status: 400 }
      );
    }

    const category = await prisma.category.delete({
      where: { id },
    });

    await deleteUploadedImages([category.image]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania kategorii:", error);

    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Kategoria nie znaleziona" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
