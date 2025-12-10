"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export function DeleteCategoryButton({ categoryId, categoryName, productCount }: DeleteCategoryButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (productCount > 0) {
      alert(`Nie można usunąć kategorii "${categoryName}" ponieważ zawiera ${productCount} produktów. Najpierw przenieś lub usuń produkty z tej kategorii.`);
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć kategorię "${categoryName}"? Ta operacja jest nieodwracalna.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się usunąć kategorii");
      }

      router.refresh();
    } catch (error) {
      console.error("Błąd usuwania kategorii:", error);
      alert(error instanceof Error ? error.message : "Nie udało się usunąć kategorii");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Usuń kategorię"
    >
      <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
    </button>
  );
}
