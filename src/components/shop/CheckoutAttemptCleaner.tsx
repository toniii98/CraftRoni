"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

const CHECKOUT_ATTEMPT_STORAGE_KEY = "craftroni-checkout-attempt-v1";

export function CheckoutAttemptCleaner({ orderNumber }: { orderNumber: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY) || "null") as
        | { orderNumber?: unknown }
        | null;
      if (!stored || stored.orderNumber !== orderNumber) return;
      localStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
    } catch {
      return;
    }
    clearCart();
  }, [clearCart, orderNumber]);

  return null;
}
