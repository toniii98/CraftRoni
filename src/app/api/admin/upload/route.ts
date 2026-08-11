import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { isUploadFolder, uploadsDir, uploadUrl } from "@/lib/uploads";

// POST /api/admin/upload - Upload zdjęć (multipart/form-data)
//   files  — pliki (jeden lub wiele)
//   folder — "products" (domyślnie) albo "categories"
// Pliki lądują na dysku serwera w public/uploads/<folder>.

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Nagłówki (magic bytes) — nie ufamy deklarowanemu Content-Type z przeglądarki
function looksLikeImage(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
      );
    case "image/webp":
      return (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const rawFolder = formData.get("folder") ?? "products";
    if (!isUploadFolder(rawFolder)) {
      return NextResponse.json({ error: "Nieprawidłowy katalog docelowy" }, { status: 400 });
    }
    const folder = rawFolder;

    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Nie przesłano plików" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksymalnie ${MAX_FILES} plików naraz` },
        { status: 400 }
      );
    }

    const targetDir = uploadsDir(folder);
    await mkdir(targetDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const extension = ALLOWED_TYPES[file.type];
      if (!extension) {
        return NextResponse.json(
          { error: `Niedozwolony format pliku "${file.name}" — dozwolone: JPG, PNG, WebP` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Plik "${file.name}" jest za duży (limit 5 MB)` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (!looksLikeImage(buffer, file.type)) {
        return NextResponse.json(
          { error: `Plik "${file.name}" nie jest prawidłowym obrazem` },
          { status: 400 }
        );
      }

      const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${extension}`;
      await writeFile(path.join(targetDir, filename), buffer);
      urls.push(uploadUrl(folder, filename));
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("Błąd uploadu zdjęć:", error);
    return NextResponse.json({ error: "Błąd uploadu zdjęć" }, { status: 500 });
  }
}
