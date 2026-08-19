import { NextResponse } from "next/server";
import { login, deleteSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { loginSchema, firstZodMessage } from "@/lib/validation";
import {
  assertSameOrigin,
  readJsonWithLimit,
  RequestSecurityError,
} from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    // Ochrona przed brute force: 10 prób logowania na 15 minut z jednego IP
    const limit = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób logowania. Spróbuj ponownie później." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonWithLimit<unknown>(request, 16 * 1024);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    const result = await login(parsed.data.email, parsed.data.password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd logowania:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd wylogowania:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
