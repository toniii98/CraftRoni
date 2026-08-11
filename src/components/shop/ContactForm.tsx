"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "@/components/ui";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqerkgqj";

type SubmissionStatus =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Formspree zwrócił HTTP ${response.status}`);
      }

      form.reset();
      setStatus({
        type: "success",
        message: "Wiadomość została wysłana. Odpiszę najszybciej, jak to możliwe.",
      });
    } catch (error) {
      console.error("Nie udało się wysłać formularza kontaktowego:", error);
      setStatus({
        type: "error",
        message:
          "Nie udało się wysłać wiadomości. Napisz bezpośrednio na kontakt@craftroni.pl.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      action={FORMSPREE_ENDPOINT}
      method="POST"
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="_subject" value="Nowa wiadomość ze strony CraftRoni" />

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          id="contact-first-name"
          name="name"
          label="Imię"
          placeholder="Jan"
          autoComplete="given-name"
          required
        />
        <Input
          id="contact-last-name"
          name="surname"
          label="Nazwisko"
          placeholder="Kowalski"
          autoComplete="family-name"
          required
        />
      </div>

      <Input
        id="contact-email"
        name="email"
        type="email"
        label="Email"
        placeholder="jan@example.com"
        autoComplete="email"
        required
      />

      <Input
        id="contact-subject"
        name="subject"
        label="Temat"
        placeholder="W czym mogę pomóc?"
        required
      />

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Wiadomość
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted"
          placeholder="Twoja wiadomość..."
          required
        />
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="contact-privacy"
          name="privacyAccepted"
          value="tak"
          className="mt-1 rounded text-primary focus:ring-primary"
          required
        />
        <label htmlFor="contact-privacy" className="ml-2 text-sm text-muted">
          Akceptuję{" "}
          <a href="/prywatnosc" className="text-primary hover:underline">
            politykę prywatności
          </a>{" "}
          i wyrażam zgodę na przetwarzanie moich danych osobowych.
        </label>
      </div>

      {status && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-primary/20 bg-primary/5 text-primary-dark"
          }`}
        >
          {status.message}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
      </Button>
    </form>
  );
}
