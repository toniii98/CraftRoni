// Typy dla produktów
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  sku: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

// Typy dla kategorii
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  parent?: Category | null;
  children?: Category[];
  products?: Product[];
}

// Typy dla zamówień
export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string | null;
  paymentId: string | null;
  paidAt: Date | null;
  notes: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  product?: Product;
}

export type OrderStatus = 
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

// Typy dla użytkowników
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt: Date;
  updatedAt: Date;
}

// Typy dla koszyka (client-side)
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

// Typy dla formularzy
export interface CheckoutFormData {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  notes?: string;
}

// Typy dla API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Typy dla paginacji
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
