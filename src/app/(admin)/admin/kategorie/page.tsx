import { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui";
import prisma from "@/lib/prisma";
import { DeleteCategoryButton } from "@/components/admin";

export const metadata: Metadata = {
  title: "Kategorie | Admin",
  description: "Zarządzanie kategoriami produktów",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kategorie</h1>
          <p className="text-muted">Zarządzaj kategoriami produktów ({categories.length} kategorii)</p>
        </div>
        <Link href="/admin/kategorie/nowa">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj kategorię
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Brak kategorii</h3>
            <p className="text-muted mb-4">Nie masz jeszcze żadnych kategorii.</p>
            <Link href="/admin/kategorie/nowa">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwszą kategorię
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Kategoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Produkty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-background">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FolderOpen className="h-5 w-5 text-muted" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-foreground block">
                          {category.name}
                        </span>
                        {category.description && (
                          <span className="text-sm text-muted line-clamp-1">
                            {category.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted font-mono text-sm">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground font-medium">
                      {category._count.products}
                    </span>
                    <span className="text-muted"> produktów</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-background text-foreground"
                      }`}
                    >
                      {category.isActive ? "Aktywna" : "Nieaktywna"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/kategorie/${category.id}/edytuj`}
                        className="p-2 text-muted hover:text-foreground transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteCategoryButton 
                        categoryId={category.id} 
                        categoryName={category.name}
                        productCount={category._count.products}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
