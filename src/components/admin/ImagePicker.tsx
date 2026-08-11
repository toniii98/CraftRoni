"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImagePickerProps {
  /** Adres aktualnego zdjęcia (pusty string = brak). */
  value: string;
  onChange: (url: string) => void;
  /** Katalog docelowy uploadu. */
  folder?: "products" | "categories";
  label?: string;
  hint?: string;
}

/**
 * Wybór pojedynczego zdjęcia: upload z dysku, podgląd i usunięcie.
 * Używane m.in. dla zdjęcia kategorii.
 */
export function ImagePicker({
  value,
  onChange,
  folder = "categories",
  label = "Zdjęcie",
  hint = "JPG, PNG lub WebP — maksymalnie 5 MB",
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wgrać zdjęcia");
      }

      onChange(data.urls[0]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nie udało się wgrać zdjęcia");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-foreground mb-1">{label}</span>

      {error && (
        <div className="bg-primary/5 border border-primary/20 text-primary-dark px-3 py-2 rounded-lg text-sm mb-2">
          {error}
        </div>
      )}

      {value ? (
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border bg-background flex-shrink-0">
            <Image src={value} alt="Podgląd zdjęcia" fill sizes="112px" className="object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-background transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wgrywanie...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Zmień zdjęcie
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-primary transition-colors"
            >
              <X className="h-4 w-4" />
              Usuń zdjęcie
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-border rounded-lg px-4 py-6 text-center text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Wgrywanie...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Kliknij, aby dodać zdjęcie
            </span>
          )}
        </button>
      )}

      <p className="text-xs text-muted mt-2">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
