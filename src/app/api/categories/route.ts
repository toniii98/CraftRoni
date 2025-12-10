import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/categories - Lista kategorii
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się pobrać kategorii" },
      { status: 500 }
    );
  }
}
