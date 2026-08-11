"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";

export function AccountLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Błąd wylogowania:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}
