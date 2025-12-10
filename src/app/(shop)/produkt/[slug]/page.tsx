import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProductPageClient } from "@/components/shop/ProductPageClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Generowanie metadanych dla SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  
  if (!product) {
    return {
      title: "Produkt nie znaleziony",
    };
  }
  
  return {
    title: product.name,
    description: product.description || `Kup ${product.name} w sklepie CraftRoni`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  
  if (!product) {
    notFound();
  }
  
  // Pobierz powiązane produkty
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 4,
  });

  // Konwersja Decimal na number dla komponentu klienta
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  };
  
  const serializedRelated = relatedProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
  }));

  return (
    <ProductPageClient
      product={serializedProduct}
      relatedProducts={serializedRelated}
    />
  );
}
