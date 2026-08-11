import { Metadata } from "next";
import { Instagram, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Skontaktuj się z craft.roni",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground">Kontakt</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Dane kontaktowe
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Email</h3>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-muted hover:text-primary transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Instagram</h3>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-primary transition-colors"
                >
                  @craft.roni
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          <div className="bg-background rounded-xl p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Napisz do mnie
            </h2>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Imię" placeholder="Jan" required />
                <Input label="Nazwisko" placeholder="Kowalski" required />
              </div>

              <Input
                type="email"
                label="Email"
                placeholder="jan@example.com"
                required
              />

              <Input
                label="Temat"
                placeholder="W czym możemy pomóc?"
                required
              />

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Wiadomość
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted"
                  placeholder="Twoja wiadomość..."
                  required
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacy"
                  className="mt-1 rounded text-primary focus:ring-primary"
                  required
                />
                <label
                  htmlFor="privacy"
                  className="ml-2 text-sm text-muted"
                >
                  Akceptuję{" "}
                  <a href="/prywatnosc" className="text-primary hover:underline">
                    politykę prywatności
                  </a>{" "}
                  i wyrażam zgodę na przetwarzanie moich danych osobowych.
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Wyślij wiadomość
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
