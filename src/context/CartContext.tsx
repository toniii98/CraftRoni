"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product, CartItem, Cart } from "@/types";

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "craftroni-cart";
const FREE_SHIPPING_THRESHOLD = 200;
const DEFAULT_SHIPPING_COST = 15;

function calculateCartTotals(items: CartItem[]): Cart {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity,
    0
  );
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
  const total = subtotal + shippingCost;

  return {
    items,
    subtotal,
    shippingCost,
    total,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    shippingCost: DEFAULT_SHIPPING_COST,
    total: DEFAULT_SHIPPING_COST,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Wczytaj koszyk z localStorage przy starcie
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const items: CartItem[] = JSON.parse(stored);
        setCart(calculateCartTotals(items));
      }
    } catch (error) {
      console.error("Błąd wczytywania koszyka:", error);
    }
    setIsLoaded(true);
  }, []);

  // Zapisuj koszyk do localStorage przy każdej zmianie
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.items));
    }
  }, [cart.items, isLoaded]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product.id
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Produkt już jest w koszyku - zwiększ ilość
        newItems = prev.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Dodaj nowy produkt
        newItems = [
          ...prev.items,
          {
            productId: product.id,
            product,
            quantity,
          },
        ];
      }

      return calculateCartTotals(newItems);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.productId !== productId);
      return calculateCartTotals(newItems);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) => {
      const newItems = prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      return calculateCartTotals(newItems);
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      shippingCost: DEFAULT_SHIPPING_COST,
      total: DEFAULT_SHIPPING_COST,
    });
  };

  const isInCart = (productId: string) => {
    return cart.items.some((item) => item.productId === productId);
  };

  const getItemQuantity = (productId: string) => {
    const item = cart.items.find((item) => item.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
