import { unlink } from "fs/promises";
import path from "path";

// Zdjęcia trafiają na dysk serwera (VPS) do public/uploads/<folder>
// i są serwowane statycznie przez Next.

export const UPLOAD_FOLDERS = ["products", "categories"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(value);
}

export const UPLOADS_URL_PREFIX = "/uploads/";

export function uploadsDir(folder: UploadFolder): string {
  return path.join(process.cwd(), "public", "uploads", folder);
}

export function uploadUrl(folder: UploadFolder, filename: string): string {
  return `${UPLOADS_URL_PREFIX}${folder}/${filename}`;
}

/**
 * Usuwa z dysku pliki wgrane przez panel (best-effort — brak pliku nie jest błędem).
 * Adresy spoza /uploads/<folder>/ są ignorowane.
 */
export async function deleteUploadedImages(urls: Array<string | null | undefined>): Promise<void> {
  for (const url of urls) {
    if (!url || !url.startsWith(UPLOADS_URL_PREFIX)) continue;

    // /uploads/<folder>/<plik> — oba segmenty muszą być bezpieczne
    const rest = url.slice(UPLOADS_URL_PREFIX.length).split("/");
    if (rest.length !== 2) continue;

    const [folder, rawName] = rest;
    if (!isUploadFolder(folder)) continue;

    // path.basename odcina ewentualne "../" — plik musi leżeć w katalogu uploadów
    const filename = path.basename(rawName);
    try {
      await unlink(path.join(uploadsDir(folder), filename));
    } catch {
      // plik mógł już nie istnieć
    }
  }
}
