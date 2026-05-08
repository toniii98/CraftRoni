import { NextResponse } from "next/server";
import { getCurrentUser, getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const defaultAddress = user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        profile: user.profile,
        addresses: user.addresses,
        defaultAddress,
      },
    });
  } catch (error) {
    console.error("Błąd sprawdzania sesji:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
