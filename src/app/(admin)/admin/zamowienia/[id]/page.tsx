import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  ShoppingBag
} from "lucide-react";
import prisma from "@/lib/prisma";
import { OrderStatusForm } from "./OrderStatusForm";

export const metadata: Metadata = {
  title: "Szczegóły zamówienia | Admin",
  description: "Szczegóły zamówienia",
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: "Oczekujące", className: "bg-yellow-100 text-yellow-800", icon: Clock },
    PAID: { label: "Opłacone", className: "bg-blue-100 text-blue-800", icon: CreditCard },
    PROCESSING: { label: "W realizacji", className: "bg-purple-100 text-purple-800", icon: Package },
    SHIPPED: { label: "Wysłane", className: "bg-indigo-100 text-indigo-800", icon: Truck },
    DELIVERED: { label: "Dostarczone", className: "bg-green-100 text-green-800", icon: CheckCircle },
    CANCELLED: { label: "Anulowane", className: "bg-primary/10 text-primary-dark", icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price: number) => {
  return price.toFixed(2).replace(".", ",") + " zł";
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const orderItems = order.items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price),
    productSlug: item.product?.slug || null,
    image: item.product?.images[0]?.url || null,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/zamowienia"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do zamówień
        </Link>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              Zamówienie {order.orderNumber}
            </h1>
            <p className="text-muted mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-surface rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-muted" />
                Produkty ({orderItems.length})
              </h2>
            </div>
            <div className="divide-y">
              {orderItems.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-background rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.productSlug ? (
                      <Link
                        href={`/produkt/${item.productSlug}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{item.name}</span>
                    )}
                    <p className="text-sm text-muted">
                      Ilość: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-background border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Suma produktów</span>
                <span className="text-foreground">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Dostawa</span>
                <span className="text-foreground">
                  {Number(order.shippingCost) === 0 ? "Gratis" : formatPrice(Number(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span className="text-foreground">Razem</span>
                <span className="text-primary">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-surface rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted" />
                  Notatki
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-foreground whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Customer Info & Status */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-surface rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-muted" />
                Dane klienta
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-muted">Imię i nazwisko</p>
                <p className="font-medium text-foreground">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted" />
                <a 
                  href={`mailto:${order.customerEmail}`}
                  className="text-primary hover:text-primary-dark"
                >
                  {order.customerEmail}
                </a>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted" />
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="text-foreground hover:text-primary"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.user && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted">Zarejestrowany klient</p>
                  <p className="text-sm text-foreground">{order.user.name || order.user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-surface rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted" />
                Adres dostawy
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-foreground font-medium">{order.customerName}</p>
              <p className="text-foreground">{order.shippingAddress}</p>
              <p className="text-foreground">
                {order.shippingZip} {order.shippingCity}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-surface rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted" />
                Płatność
              </h2>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Metoda</span>
                <span className="text-foreground">
                  {order.paymentMethod || "Przy odbiorze"}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">ID płatności</span>
                  <span className="text-foreground font-mono text-xs">{order.paymentId}</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Data płatności</span>
                  <span className="text-foreground">{formatDate(order.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-surface rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted" />
                Zmień status
              </h2>
            </div>
            <div className="px-6 py-4">
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
