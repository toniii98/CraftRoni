import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  isValidPaymentAccessToken,
  ORDER_RESERVATION_MINUTES,
  PAYMENT_ACCESS_COOKIE,
  verifyPaymentAccessToken,
} from "@/lib/order-security";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isProductionEnvironment } from "@/lib/runtime-env";

function redirect(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

// Zużywa token z linku tylko do ustawienia krótkiego cookie HttpOnly, po czym
// usuwa sekret z paska adresu. To umożliwia bezpieczne wznowienie po powrocie.
export async function GET(request: NextRequest) {
  const limit = rateLimit(`autopay-start:${clientIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return redirect(request, "/koszyk");

  const orderNumber = request.nextUrl.searchParams.get("order") || "";
  const token = request.nextUrl.searchParams.get("token");
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(orderNumber) || !isValidPaymentAccessToken(token)) {
    return redirect(request, "/koszyk");
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { checkoutKeyHash: true, reservationExpiresAt: true },
  });
  if (
    !order ||
    !order.reservationExpiresAt ||
    order.reservationExpiresAt <= new Date() ||
    !verifyPaymentAccessToken(token, order.checkoutKeyHash)
  ) {
    return redirect(request, "/koszyk");
  }

  const response = redirect(
    request,
    `/platnosc/autopay?${new URLSearchParams({ order: orderNumber }).toString()}`
  );
  response.cookies.set(PAYMENT_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: isProductionEnvironment(),
    sameSite: "lax",
    maxAge: ORDER_RESERVATION_MINUTES * 60,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
