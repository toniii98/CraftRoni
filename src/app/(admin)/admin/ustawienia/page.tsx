"use client";

import { useState } from "react";
import { Save, Store, Truck, CreditCard, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState({
    // Ogólne
    storeName: "CraftRoni",
    storeDescription: "Polski sklep z rękodziełem",
    storeEmail: "kontakt@craftroni.pl",
    storePhone: "+48 123 456 789",
    storeAddress: "ul. Rzemieślnicza 1, 00-001 Warszawa",
    
    // Wysyłka
    freeShippingThreshold: 200,
    defaultShippingCost: 15,
    expressShippingCost: 25,
    estimatedDeliveryDays: "2-4",
    
    // Płatności
    przelewy24MerchantId: "",
    przelewy24CRC: "",
    przelewy24ApiKey: "",
    testMode: true,
    
    // Email
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    emailFrom: "sklep@craftroni.pl",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Zapisz ustawienia do API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert("Ustawienia zapisane!");
  };

  const tabs = [
    { id: "general", label: "Ogólne", icon: Store },
    { id: "shipping", label: "Wysyłka", icon: Truck },
    { id: "payments", label: "Płatności", icon: CreditCard },
    { id: "email", label: "Email", icon: Mail },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
          <p className="text-gray-600 mt-1">
            Konfiguracja sklepu i integracje
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Ogólne */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                label="Email kontaktowy"
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
              <Input
                label="Adres"
                name="storeAddress"
                value={settings.storeAddress}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis sklepu
              </label>
              <textarea
                name="storeDescription"
                value={settings.storeDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Wysyłka */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ustawienia wysyłki
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Próg darmowej dostawy (PLN)"
                name="freeShippingThreshold"
                type="number"
                value={settings.freeShippingThreshold}
                onChange={handleChange}
              />
              <Input
                label="Koszt standardowej dostawy (PLN)"
                name="defaultShippingCost"
                type="number"
                value={settings.defaultShippingCost}
                onChange={handleChange}
              />
              <Input
                label="Koszt ekspresowej dostawy (PLN)"
                name="expressShippingCost"
                type="number"
                value={settings.expressShippingCost}
                onChange={handleChange}
              />
              <Input
                label="Szacowany czas dostawy (dni)"
                name="estimatedDeliveryDays"
                value={settings.estimatedDeliveryDays}
                onChange={handleChange}
              />
            </div>

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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Konfiguracja Przelewy24
            </h2>

            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="testMode"
                name="testMode"
                checked={settings.testMode}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="testMode" className="text-sm text-gray-700">
                Tryb testowy (sandbox)
              </label>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="ID Sprzedawcy (Merchant ID)"
                name="przelewy24MerchantId"
                value={settings.przelewy24MerchantId}
                onChange={handleChange}
                placeholder="Wprowadź ID sprzedawcy"
              />
              <Input
                label="Klucz CRC"
                name="przelewy24CRC"
                type="password"
                value={settings.przelewy24CRC}
                onChange={handleChange}
                placeholder="Wprowadź klucz CRC"
              />
              <Input
                label="Klucz API"
                name="przelewy24ApiKey"
                type="password"
                value={settings.przelewy24ApiKey}
                onChange={handleChange}
                placeholder="Wprowadź klucz API"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Dane do integracji znajdziesz w panelu Przelewy24. 
                W trybie testowym płatności nie są realizowane.
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Konfiguracja SMTP
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Serwer SMTP"
                name="smtpHost"
                value={settings.smtpHost}
                onChange={handleChange}
                placeholder="np. smtp.gmail.com"
              />
              <Input
                label="Port SMTP"
                name="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={handleChange}
              />
              <Input
                label="Użytkownik SMTP"
                name="smtpUser"
                value={settings.smtpUser}
                onChange={handleChange}
                placeholder="Adres email"
              />
              <Input
                label="Hasło SMTP"
                name="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={handleChange}
                placeholder="Hasło do konta email"
              />
              <Input
                label="Adres nadawcy"
                name="emailFrom"
                type="email"
                value={settings.emailFrom}
                onChange={handleChange}
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Powiadomienia email:</strong> Po skonfigurowaniu SMTP, klienci 
                będą otrzymywać automatyczne powiadomienia o statusie zamówień.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
