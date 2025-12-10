import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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

    return NextResponse.json(product);
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
    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      sku,
      stock,
      categoryId,
      isActive,
      isFeatured,
      images,
    } = body;

    // Sprawdź czy produkt istnieje
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produkt nie znaleziony" },
        { status: 404 }
      );
    }

    // Sprawdź czy slug jest unikalny (jeśli zmieniony)
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Produkt z tym slugem już istnieje" },
          { status: 400 }
        );
      }
    }

    // Aktualizuj produkt
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existingProduct.name,
        slug: slug ?? existingProduct.slug,
        description: description !== undefined ? description : existingProduct.description,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : existingProduct.salePrice,
        sku: sku !== undefined ? sku : existingProduct.sku,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        categoryId: categoryId ?? existingProduct.categoryId,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
        isFeatured: isFeatured !== undefined ? isFeatured : existingProduct.isFeatured,
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Jeśli podano nowe obrazy, zaktualizuj je
    if (images !== undefined) {
      // Usuń stare obrazy
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      // Dodaj nowe obrazy
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: { url: string; alt?: string }, index: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt || product.name,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      }
    }

    // Pobierz zaktualizowany produkt z obrazami
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Błąd aktualizacji produktu:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji produktu" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Usuwanie produktu
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

    // Sprawdź czy produkt istnieje
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produkt nie znaleziony" },
        { status: 404 }
      );
    }

    // Usuń obrazy produktu
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });

    // Usuń produkt
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania produktu:", error);
    return NextResponse.json(
      { error: "Błąd usuwania produktu" },
      { status: 500 }
    );
  }
}
