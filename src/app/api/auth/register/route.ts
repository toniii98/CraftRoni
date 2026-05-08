import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.fullName === "string" ? body.fullName : "";
    const phone = typeof body.phone === "string" ? body.phone : "";

    if (!email.trim() || !password || !fullName.trim()) {
      return NextResponse.json(
        { error: "Imię i nazwisko, email oraz hasło są wymagane" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Hasło musi mieć co najmniej 8 znaków" },
        { status: 400 }
      );
    }

    const result = await registerCustomer({
      email,
      password,
      fullName,
      phone,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: result.user }, { status: 201 });
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return NextResponse.json(
      { error: "Nie udało się utworzyć konta" },
      { status: 500 }
    );
  }
}
