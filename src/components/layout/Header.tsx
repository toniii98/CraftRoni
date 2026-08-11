"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ShoppingCart, Search, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

const navigation = [
  { name: "Strona główna", href: "/" },
  { name: "Sklep", href: "/sklep" },
  { name: "Kategorie", href: "/kategorie" },
  { name: "O mnie", href: "/o-nas" },
  { name: "Kontakt", href: "/kontakt" },
];

interface HeaderProps {
  /** Próg darmowej dostawy z ustawień sklepu. */
  freeShippingThreshold?: number;
  /** Czy górny banner promujący darmową dostawę ma być widoczny. */
  showFreeShippingBanner?: boolean;
}

export function Header({
  freeShippingThreshold = 200,
  showFreeShippingBanner = true,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cart } = useCart();

  // Oblicz całkowitą liczbę produktów w koszyku
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-surface shadow-sm sticky top-0 z-50 border-b border-border">
      {/* Top bar */}
      {showFreeShippingBanner && (
        <div className="bg-primary text-white text-center py-2 text-sm">
          🎁 Darmowa dostawa od {freeShippingThreshold} zł!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="craft.roni — strona główna">
            <Image
              src="/brand/wordmark.png"
              alt="craft.roni — polskie rękodzieło"
              width={152}
              height={44}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              className={`p-2 transition-colors ${
                isSearchOpen ? "text-primary" : "text-foreground hover:text-primary"
              }`}
              aria-label="Szukaj"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Konto klienta */}
            <Link
              href="/konto"
              className="p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Moje konto"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/koszyk"
              className="p-2 text-foreground hover:text-primary transition-colors relative"
              aria-label="Koszyk"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="py-3 border-t border-border">
            <form action="/sklep" method="get" className="flex gap-2">
              <input
                type="search"
                name="szukaj"
                placeholder="Czego szukasz? Np. kolczyki, kubek, świeca..."
                autoFocus
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                Szukaj
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
