"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Minus, Plus, ChevronLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui";
import { ProductGrid } from "@/components/shop";

interface ProductPageClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductPageClient({ product, relatedProducts }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isInCart } = useCart();

  const images = product.images?.length > 0 
    ? product.images 
    : [{ id: "placeholder", url: "", alt: "Placeholder", isPrimary: true, sortOrder: 0 }];
  
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-red-600">Strona główna</Link>
        <span>/</span>
        <Link href="/sklep" className="hover:text-red-600">Sklep</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/sklep?category=${product.category.slug}`} className="hover:text-red-600">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Back link */}
      <Link
        href="/sklep"
        className="inline-flex items-center text-gray-600 hover:text-red-600 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Wróć do sklepu
      </Link>

      {/* Product section */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {images[selectedImage]?.url ? (
              <Image
                src={images[selectedImage].url}
                alt={images[selectedImage].alt || product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span>[Brak zdjęcia produktu]</span>
              </div>
            )}
            
            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-4 left-4">
                <span className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded">
                  -{discountPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-red-600" : "border-gray-200"
                  }`}
                >
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt={image.alt || `Zdjęcie ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          {/* Category */}
          {product.category && (
            <Link
              href={`/sklep?category=${product.category.slug}`}
              className="text-sm text-red-600 hover:text-red-700 uppercase tracking-wide"
            >
              {product.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-red-600">
              {formatPrice(product.salePrice || product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600">
                  Dostępny ({product.stock} szt.)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-red-600">Brak w magazynie</span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ilość:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isInCart(product.id)}
              size="lg"
              className="flex-1"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isInCart(product.id) ? "Już w koszyku" : "Dodaj do koszyka"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              aria-label="Dodaj do ulubionych"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-500">
              SKU: <span className="font-mono">{product.sku}</span>
            </p>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Darmowa dostawa</p>
                <p className="text-xs text-gray-500">Od 200 zł</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Bezpieczne płatności</p>
                <p className="text-xs text-gray-500">Przelewy24</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">14 dni na zwrot</p>
                <p className="text-xs text-gray-500">Bez podania przyczyny</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Podobne produkty
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
