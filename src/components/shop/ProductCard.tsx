"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link href={`/produkt/${product.slug}`} className="group block">
      <div className="bg-surface rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative aspect-square bg-background">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              <span className="text-sm">[Brak zdjęcia]</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-primary-dark text-white text-xs font-medium px-2 py-1 rounded">
                Wyróżnione
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-foreground text-white text-xs font-medium px-2 py-1 rounded">
                Brak w magazynie
              </span>
            )}
          </div>

          {/* Quick actions — wishlist (na hover, akcja drugorzędna) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-2 bg-surface rounded-full shadow-md hover:text-primary transition-colors"
              aria-label="Dodaj do ulubionych"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Wishlist functionality
              }}
            >
              <Heart className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          <div>
            {product.category && (
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                {product.category.name}
              </p>
            )}

            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(product.salePrice || product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Add to cart — zawsze widoczny pod ceną (zgodnie z UI guide) */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isInCart(product.id)}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.stock === 0
              ? "Brak w magazynie"
              : isInCart(product.id)
              ? "W koszyku"
              : "Dodaj do koszyka"}
          </Button>
        </div>
      </div>
    </Link>
  );
}
