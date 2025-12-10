"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  sku: string | null;
  stock: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    sku: "",
    stock: "0",
    categoryId: "",
    isActive: true,
    isFeatured: false,
  });

  // Fetch product and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/categories"),
        ]);

        if (!productRes.ok) {
          throw new Error("Nie znaleziono produktu");
        }

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        const product: Product = productData.product;
        
        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price.toString(),
          salePrice: product.salePrice?.toString() || "",
          sku: product.sku || "",
          stock: product.stock.toString(),
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        });

        const cats = categoriesData.categories || categoriesData;
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
      } catch (error) {
        console.error("Błąd pobierania danych:", error);
        setError(error instanceof Error ? error.message : "Nie udało się pobrać danych");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [id]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          stock: parseInt(formData.stock),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zaktualizować produktu");
      }

      router.push("/admin/produkty");
      router.refresh();
    } catch (error) {
      console.error("Błąd aktualizacji produktu:", error);
      setError(error instanceof Error ? error.message : "Nie udało się zaktualizować produktu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          href="/admin/produkty" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót do produktów
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edytuj produkt</h1>
        <p className="text-gray-600">Zaktualizuj informacje o produkcie</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Podstawowe informacje</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa produktu *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="np. Kolczyki z bursztynem"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="np. kolczyki-z-bursztynem"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Opis produktu
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Opisz produkt..."
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Kategoria *
              </label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Wybierz kategorię</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU (kod produktu)
              </label>
              <input
                type="text"
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="np. KOLC-BURSZ-001"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cena i dostępność</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Cena (zł) *
              </label>
              <input
                type="number"
                id="price"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                Cena promocyjna (zł)
              </label>
              <input
                type="number"
                id="salePrice"
                value={formData.salePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stan magazynowy *
              </label>
              <input
                type="number"
                id="stock"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ustawienia</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-medium text-gray-900">Aktywny</span>
                <p className="text-sm text-gray-500">Produkt będzie widoczny w sklepie</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-medium text-gray-900">Wyróżniony</span>
                <p className="text-sm text-gray-500">Produkt będzie wyświetlany na stronie głównej</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link 
            href="/admin/produkty"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Zapisz zmiany
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
