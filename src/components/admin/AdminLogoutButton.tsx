"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
    >
      <LogOut className="h-5 w-5" />
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </button>
  );
}
