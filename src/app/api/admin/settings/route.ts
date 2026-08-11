import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getShopSettings, saveShopSettings } from "@/lib/settings";
import { settingsUpdateSchema, firstZodMessage } from "@/lib/validation";
import { isP24Configured } from "@/lib/p24";
import { isEmailConfigured } from "@/lib/email";

// GET /api/admin/settings - Ustawienia sklepu + status integracji z .env
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const settings = await getShopSettings();
    return NextResponse.json({
      settings,
      integrations: {
        p24Configured: isP24Configured(),
        p24Sandbox: process.env.P24_SANDBOX !== "false",
        emailConfigured: isEmailConfigured(),
      },
    });
  } catch (error) {
    console.error("Błąd pobierania ustawień:", error);
    return NextResponse.json({ error: "Błąd pobierania ustawień" }, { status: 500 });
  }
}

// PUT /api/admin/settings - Zapis ustawień sklepu
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    await saveShopSettings({
      storeName: parsed.data.storeName,
      storeEmail: parsed.data.storeEmail,
      storePhone: parsed.data.storePhone || "",
      freeShippingThreshold: parsed.data.freeShippingThreshold,
      defaultShippingCost: parsed.data.defaultShippingCost,
    });

    const settings = await getShopSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Błąd zapisu ustawień:", error);
    return NextResponse.json({ error: "Błąd zapisu ustawień" }, { status: 500 });
  }
}
