import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productUpdateSchema, firstZodMessage } from "@/lib/validation";
import { deleteUploadedImages } from "@/lib/uploads";

// GET /api/admin/products/[id] - Szczegóły produktu
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produkt nie znaleziony" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Błąd pobierania produktu:", error);
    return NextResponse.json(
      { error: "Błąd pobierania produktu" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Edycja produktu
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produkt nie znaleziony" },
        { status: 404 }
      );
    }

    const newPrice = input.price ?? Number(existingProduct.price);
    const newSalePrice =
      input.salePrice !== undefined
        ? input.salePrice
        : existingProduct.salePrice
          ? Number(existingProduct.salePrice)
          : null;
    if (newSalePrice != null && newSalePrice >= newPrice) {
      return NextResponse.json(
        { error: "Cena promocyjna musi być niższa od ceny podstawowej" },
        { status: 400 }
      );
    }

    // Sprawdź czy slug jest unikalny (jeśli zmieniony)
    if (input.slug && input.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: input.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Produkt z tym slugem już istnieje" },
          { status: 400 }
        );
      }
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Wybrana kategoria nie istnieje" },
          { status: 400 }
        );
      }
    }

    // Aktualizacja produktu i (opcjonalnie) podmiana obrazków w jednej transakcji
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: input.name ?? undefined,
          slug: input.slug ?? undefined,
          description:
            input.description !== undefined ? input.description : undefined,
          price: input.price ?? undefined,
          salePrice: input.salePrice !== undefined ? input.salePrice : undefined,
          sku: input.sku !== undefined ? input.sku : undefined,
          stock: input.stock ?? undefined,
          categoryId: input.categoryId ?? undefined,
          isActive: input.isActive ?? undefined,
          isFeatured: input.isFeatured ?? undefined,
        },
      });

      if (input.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (input.images.length > 0) {
          await tx.productImage.createMany({
            data: input.images.map((img, index) => ({
              productId: id,
              url: img.url,
              alt: img.alt || input.name || existingProduct.name,
              isPrimary: index === 0,
              sortOrder: index,
            })),
          });
        }
      }
    });

    // Usuń z dysku pliki, które zniknęły z listy obrazków
    if (input.images !== undefined) {
      const keptUrls = new Set(input.images.map((img) => img.url));
      const removedUrls = existingProduct.images
        .map((img) => img.url)
        .filter((url) => !keptUrls.has(url));
      await deleteUploadedImages(removedUrls);
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Błąd aktualizacji produktu:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji produktu" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Usuwanie produktu
// Produkt, który pojawia się w zamówieniach, jest archiwizowany (ukrywany),
// a nie usuwany — historia zamówień musi pozostać kompletna.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produkt nie znaleziony" },
        { status: 404 }
      );
    }

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        message:
          "Produkt występuje w zamówieniach, więc został zarchiwizowany (ukryty w sklepie) zamiast usunięty.",
      });
    }

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    await deleteUploadedImages(existingProduct.images.map((img) => img.url));

    return NextResponse.json({ success: true, archived: false });
  } catch (error) {
    console.error("Błąd usuwania produktu:", error);
    return NextResponse.json(
      { error: "Błąd usuwania produktu" },
      { status: 500 }
    );
  }
}
