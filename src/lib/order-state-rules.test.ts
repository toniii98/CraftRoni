import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedAdminTransition,
  paymentReviewReason,
  paymentReviewResolutionPlan,
} from "./order-state-rules";

test("administrator nie może ręcznie potwierdzić Autopay ani cofnąć anulowania", () => {
  assert.equal(isAllowedAdminTransition("PENDING", "PAID"), false);
  assert.equal(isAllowedAdminTransition("PENDING", "CANCELLED"), true);
  assert.equal(isAllowedAdminTransition("CANCELLED", "PENDING"), false);
  assert.equal(isAllowedAdminTransition("PAID", "PROCESSING"), true);
});

test("rozstrzygnięcie review zachowuje spójność statusu i magazynu", () => {
  assert.deepEqual(paymentReviewResolutionPlan("PENDING", false, "PAYMENT_ACCEPTED"), {
    nextStatus: "PAID",
    reserveStock: false,
    releaseStock: false,
  });
  assert.deepEqual(paymentReviewResolutionPlan("CANCELLED", true, "PAYMENT_ACCEPTED"), {
    nextStatus: "PAID",
    reserveStock: true,
    releaseStock: false,
  });
  assert.deepEqual(paymentReviewResolutionPlan("PENDING", false, "REFUND_CONFIRMED"), {
    nextStatus: "CANCELLED",
    reserveStock: false,
    releaseStock: true,
  });
  assert.deepEqual(paymentReviewResolutionPlan("PAID", false, "REFUND_CONFIRMED"), {
    nextStatus: "PAID",
    reserveStock: false,
    releaseStock: false,
  });
  assert.deepEqual(paymentReviewResolutionPlan("PENDING", false, "NO_PAYMENT_FOUND"), {
    nextStatus: "CANCELLED",
    reserveStock: false,
    releaseStock: true,
  });
  assert.deepEqual(paymentReviewResolutionPlan("PAID", false, "NO_PAYMENT_FOUND"), {
    nextStatus: "PAID",
    reserveStock: false,
    releaseStock: false,
  });
  assert.equal(paymentReviewResolutionPlan("PAID", false, "PAYMENT_ACCEPTED"), null);
});

test("rozpoznaje podwójną i późną płatność", () => {
  assert.equal(
    paymentReviewReason(
      { paymentId: "REMOTE-1", paidAt: new Date(), status: "PAID", stockReleasedAt: null },
      "REMOTE-2"
    ),
    "MULTIPLE_SUCCESSFUL_PAYMENTS"
  );
  assert.equal(
    paymentReviewReason(
      { paymentId: null, paidAt: null, status: "CANCELLED", stockReleasedAt: new Date() },
      "REMOTE-1"
    ),
    "LATE_PAYMENT_AFTER_STOCK_RELEASE"
  );
});
