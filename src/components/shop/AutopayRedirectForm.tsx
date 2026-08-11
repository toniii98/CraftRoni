"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface AutopayRedirectFormProps {
  action: string;
  fields: Record<string, string>;
}

export function AutopayRedirectForm({ action, fields }: AutopayRedirectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} action={action} method="POST">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="lg">
        Przejdź do bezpiecznej płatności
      </Button>
    </form>
  );
}

export function AutopayRedirectingMessage() {
  return (
    <div className="flex items-center justify-center gap-3 text-muted mb-6" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Przekierowujemy Cię do bezpiecznej płatności Autopay…</span>
    </div>
  );
}
