import { Metadata } from "next";
import { CartPageClient } from "@/components/shop/CartPageClient";

export const metadata: Metadata = {
  title: "Koszyk",
  description: "Twój koszyk zakupowy - przejrzyj wybrane produkty i przejdź do płatności",
};

export default function CartPage() {
  return <CartPageClient />;
}
