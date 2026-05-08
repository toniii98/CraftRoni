"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

interface ProfileFormProps {
  initialFullName: string;
  initialPhone: string;
  email: string;
}

export function ProfileForm({ initialFullName, initialPhone, email }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się zapisać zmian");
        return;
      }

      setMessage("Dane konta zostały zapisane.");
      router.refresh();
    } catch {
      setError("Nie udało się zapisać zmian.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Email" value={email} disabled />
        <Input
          label="Telefon"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+48 123 456 789"
        />
      </div>
      <Input
        label="Imię i nazwisko"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Jan Kowalski"
      />
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-primary">{error}</p>}
      <Button type="submit" isLoading={isSaving}>
        Zapisz dane
      </Button>
    </form>
  );
}
