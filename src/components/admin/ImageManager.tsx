"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";

export interface ProductImageInput {
  url: string;
  alt?: string;
}

interface ImageManagerProps {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
  /** Tekst alternatywny nadawany nowym zdjęciom (zwykle nazwa produktu). */
  defaultAlt?: string;
}

/**
 * Zarządzanie zdjęciami produktu: upload wielu plików, usuwanie,
 * zmiana kolejności. Pierwsze zdjęcie jest zdjęciem głównym.
 */
export function ImageManager({ images, onChange, defaultAlt }: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      for (const file of Array.from(fileList)) {
        formData.append("files", file);
      }
      formData.append("folder", "products");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wgrać zdjęć");
      }

      const newImages: ProductImageInput[] = (data.urls as string[]).map((url) => ({
        url,
        alt: defaultAlt || undefined,
      }));
      onChange([...images, ...newImages]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nie udało się wgrać zdjęć");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-primary/5 border border-primary/20 text-primary-dark px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="relative group border border-border rounded-lg overflow-hidden bg-background"
            >
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.alt || `Zdjęcie ${index + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>

              {index === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded">
                  <Star className="h-3 w-3" />
                  Główne
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/70 px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-white disabled:opacity-30"
                  aria-label="Przesuń w lewo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1 text-white hover:text-primary"
                  aria-label="Usuń zdjęcie"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="p-1 text-white disabled:opacity-30"
                  aria-label="Przesuń w prawo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-border rounded-lg px-4 py-8 text-center text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Wgrywanie...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Kliknij, aby dodać zdjęcia (JPG, PNG, WebP — max 5 MB)
            </span>
          )}
        </button>
        <p className="text-xs text-muted mt-2">
          Pierwsze zdjęcie jest zdjęciem głównym — kolejność zmienisz strzałkami.
        </p>
      </div>
    </div>
  );
}
