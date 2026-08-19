export type ShopOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const ALLOWED_ADMIN_TRANSITIONS: Record<ShopOrderStatus, readonly ShopOrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isAllowedAdminTransition(
  from: ShopOrderStatus,
  to: ShopOrderStatus
): boolean {
  return ALLOWED_ADMIN_TRANSITIONS[from].includes(to);
}

export type PaymentReviewReason =
  | "MULTIPLE_SUCCESSFUL_PAYMENTS"
  | "LATE_PAYMENT_AFTER_STOCK_RELEASE"
  | "MANUAL_PAID_BEFORE_ITN"
  | "UNEXPECTED_ORDER_STATE"
  | "PAYMENT_AUTHORIZED_AFTER_VALIDITY"
  | "PAYMENT_DATE_OUTSIDE_ORDER_WINDOW"
  | "LEGACY_PENDING_REQUIRES_RECONCILIATION"
  | "PAID_ORDER_CANCELLED_REFUND_REQUIRED";

export function paymentReviewReason(
  order: {
    paymentId: string | null;
    paidAt: Date | null;
    status: ShopOrderStatus;
    stockReleasedAt: Date | null;
  },
  incomingRemoteId: string
): PaymentReviewReason | null {
  if (order.paymentId && order.paymentId !== incomingRemoteId) {
    return "MULTIPLE_SUCCESSFUL_PAYMENTS";
  }
  if (order.status === "CANCELLED" || order.stockReleasedAt) {
    return "LATE_PAYMENT_AFTER_STOCK_RELEASE";
  }
  if (order.paidAt && !order.paymentId) {
    return "MANUAL_PAID_BEFORE_ITN";
  }
  return null;
}

export type PaymentReviewResolution =
  | "PAYMENT_ACCEPTED"
  | "REFUND_CONFIRMED"
  | "NO_PAYMENT_FOUND";

export function paymentReviewResolutionPlan(
  status: ShopOrderStatus,
  stockReleased: boolean,
  resolution: PaymentReviewResolution
): {
  nextStatus: ShopOrderStatus;
  reserveStock: boolean;
  releaseStock: boolean;
} | null {
  if (resolution === "PAYMENT_ACCEPTED") {
    if (status !== "PENDING" && status !== "CANCELLED") return null;
    return {
      nextStatus: "PAID",
      reserveStock: stockReleased || status === "CANCELLED",
      releaseStock: false,
    };
  }

  if (resolution === "NO_PAYMENT_FOUND") {
    return {
      nextStatus: status === "PENDING" ? "CANCELLED" : status,
      reserveStock: false,
      releaseStock: status === "PENDING" && !stockReleased,
    };
  }

  return {
    nextStatus: status === "PENDING" ? "CANCELLED" : status,
    reserveStock: false,
    releaseStock: status === "PENDING" && !stockReleased,
  };
}
