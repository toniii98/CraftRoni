"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "@/types";
import { Button, Input } from "@/components/ui";

const emptyForm = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  isDefault: false,
};

type AddressFormState = typeof emptyForm;

interface AddressesManagerProps {
  initialAddresses: Address[];
}

export function AddressesManager({ initialAddresses }: AddressesManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const endpoint = editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się zapisać adresu");
        return;
      }

      setMessage(editingId ? "Adres został zaktualizowany." : "Adres został dodany.");
      resetForm();
      router.refresh();
    } catch {
      setError("Nie udało się zapisać adresu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label || "",
      recipientName: address.recipientName,
      phone: address.phone || "",
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
  };

  const handleDelete = async (addressId: string) => {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Nie udało się usunąć adresu");
        return;
      }

      if (editingId === addressId) {
        resetForm();
      }
      setMessage("Adres został usunięty.");
      router.refresh();
    } catch {
      setError("Nie udało się usunąć adresu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {editingId ? "Edytuj adres" : "Dodaj nowy adres"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Etykieta"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Dom / Praca"
            />
            <Input
              label="Odbiorca *"
              value={form.recipientName}
              onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Telefon"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <Input
              label="Kod pocztowy *"
              value={form.postalCode}
              onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
              placeholder="00-000"
            />
          </div>
          <Input
            label="Ulica i numer *"
            value={form.line1}
            onChange={(event) => setForm((prev) => ({ ...prev, line1: event.target.value }))}
          />
          <Input
            label="Dodatkowe informacje"
            value={form.line2}
            onChange={(event) => setForm((prev) => ({ ...prev, line2: event.target.value }))}
            placeholder="np. klatka, piętro"
          />
          <Input
            label="Miasto *"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
            />
            Ustaw jako domyślny adres dostawy
          </label>
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-primary">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isSaving}>
              {editingId ? "Zapisz adres" : "Dodaj adres"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Anuluj edycję
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {initialAddresses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted">
            Nie masz jeszcze zapisanych adresów.
          </div>
        ) : (
          initialAddresses.map((address) => (
            <div key={address.id} className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {address.label || "Adres dostawy"}
                    {address.isDefault && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        Domyślny
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted">{address.recipientName}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(address)}>
                    Edytuj
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                    Usuń
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground">{address.line1}</p>
              {address.line2 && <p className="text-sm text-foreground">{address.line2}</p>}
              <p className="text-sm text-foreground">{address.postalCode} {address.city}</p>
              {address.phone && <p className="mt-2 text-sm text-muted">Telefon: {address.phone}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
