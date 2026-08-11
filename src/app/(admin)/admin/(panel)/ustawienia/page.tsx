"use client";

import { useEffect, useState } from "react";
import { Save, Store, Truck, CreditCard, Mail, Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface Settings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  showFreeShippingBanner: boolean;
  freeShippingThreshold: number;
  defaultShippingCost: number;
}

interface Integrations {
  autopayConfigured: boolean;
  autopaySandbox: boolean;
  emailConfigured: boolean;
}

export default function AdminSettingsPage() {
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState<Settings>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    showFreeShippingBanner: true,
    freeShippingThreshold: 200,
    defaultShippingCost: 15,
  });
  const [integrations, setIntegrations] = useState<Integrations>({
    autopayConfigured: false,
    autopaySandbox: true,
    emailConfigured: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    repeatPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Błąd pobierania ustawień");
        const data = await response.json();
        setSettings(data.settings);
        setIntegrations(data.integrations);
      } catch (error) {
        console.error("Błąd pobierania ustawień:", error);
        setMessage({ type: "error", text: "Nie udało się pobrać ustawień" });
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zapisać ustawień");
      }
      setSettings(data.settings);
      setMessage({ type: "success", text: "Ustawienia zostały zapisane" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się zapisać ustawień",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      setPasswordMessage({ type: "error", text: "Nowe hasła nie są identyczne" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zmienić hasła");
      }
      setPasswordForm({ currentPassword: "", newPassword: "", repeatPassword: "" });
      setPasswordMessage({
        type: "success",
        text: "Hasło zostało zmienione. Pozostałe zalogowane urządzenia zostały wylogowane.",
      });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się zmienić hasła",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: "general", label: "Ogólne", icon: Store },
    { id: "shipping", label: "Wysyłka", icon: Truck },
    { id: "payments", label: "Płatności", icon: CreditCard },
    { id: "email", label: "Email", icon: Mail },
    { id: "account", label: "Konto", icon: KeyRound },
  ];

  const IntegrationStatus = ({ ok, okLabel, missingLabel }: { ok: boolean; okLabel: string; missingLabel: string }) => (
    <div className="flex items-center gap-2">
      {ok ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm text-foreground">{okLabel}</span>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-primary" />
          <span className="text-sm text-foreground">{missingLabel}</span>
        </>
      )}
    </div>
  );

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ustawienia</h1>
          <p className="text-muted mt-1">
            Konfiguracja sklepu i integracje
          </p>
        </div>
        {activeTab !== "account" && (
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-primary/5 border border-primary/20 text-primary-dark"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-surface rounded-xl border border-border p-6">
        {/* Ogólne */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Informacje o sklepie
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Nazwa sklepu"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
              />
              <Input
                label="Email kontaktowy (powiadomienia o zamówieniach)"
                name="storeEmail"
                type="email"
                value={settings.storeEmail}
                onChange={handleChange}
              />
              <Input
                label="Telefon"
                name="storePhone"
                value={settings.storePhone}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* Wysyłka */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Ustawienia wysyłki
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Próg darmowej dostawy (PLN)"
                name="freeShippingThreshold"
                type="number"
                min={0}
                value={settings.freeShippingThreshold}
                onChange={handleChange}
              />
              <Input
                label="Koszt standardowej dostawy (PLN)"
                name="defaultShippingCost"
                type="number"
                min={0}
                value={settings.defaultShippingCost}
                onChange={handleChange}
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer">
              <input
                type="checkbox"
                name="showFreeShippingBanner"
                checked={settings.showFreeShippingBanner}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Pokazuj banner „Darmowa dostawa od … zł”
                </span>
                <span className="block mt-1 text-sm text-muted">
                  Wyłączenie ukrywa tylko górny pasek. Próg darmowej dostawy nadal
                  obowiązuje w koszyku i przy składaniu zamówienia.
                </span>
              </span>
            </label>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Wskazówka:</strong> Klienci zobaczą informację o darmowej dostawie
                przy zamówieniach powyżej {settings.freeShippingThreshold} zł.
              </p>
            </div>
          </div>
        )}

        {/* Płatności */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Autopay
            </h2>

            <IntegrationStatus
              ok={integrations.autopayConfigured}
              okLabel={
                integrations.autopaySandbox
                  ? "Skonfigurowane — TRYB TESTOWY (sandbox)"
                  : "Skonfigurowane — tryb produkcyjny"
              }
              missingLabel="Nieskonfigurowane — zamówienia przyjmowane bez płatności online"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Identyfikator serwisu i klucz współdzielony Autopay są —
                ze względów bezpieczeństwa — konfigurowane w pliku <code>.env</code> na
                serwerze, a nie w panelu. Dane znajdziesz w portalu Autopay; po zmianie
                pliku <code>.env</code> należy zrestartować aplikację.
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Powiadomienia e-mail (SMTP)
            </h2>

            <IntegrationStatus
              ok={integrations.emailConfigured}
              okLabel="Skonfigurowane — klienci otrzymują potwierdzenia zamówień"
              missingLabel="Nieskonfigurowane — e-maile nie są wysyłane"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Dane SMTP (serwer, login, hasło) są konfigurowane
                w pliku <code>.env</code> na serwerze — hasła nie są przechowywane w bazie
                danych. Po skonfigurowaniu klienci dostaną automatyczne potwierdzenie
                zamówienia, informację o płatności i o wysyłce, a Ty — powiadomienie
                o każdym nowym zamówieniu na adres „{settings.storeEmail}”.
              </p>
            </div>
          </div>
        )}

        {/* Konto */}
        {activeTab === "account" && (
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Zmiana hasła administratora
            </h2>

            {passwordMessage && (
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  passwordMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-primary/5 border border-primary/20 text-primary-dark"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <Input
              label="Obecne hasło"
              type="password"
              autoComplete="current-password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
            />
            <Input
              label="Nowe hasło (min. 8 znaków)"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
            />
            <Input
              label="Powtórz nowe hasło"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordForm.repeatPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, repeatPassword: e.target.value }))
              }
            />

            <Button type="submit" disabled={isChangingPassword}>
              <KeyRound className="h-4 w-4 mr-2" />
              {isChangingPassword ? "Zmienianie..." : "Zmień hasło"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
