import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Skontaktuj się z nami - chętnie odpowiemy na Twoje pytania",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Kontakt</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Masz pytania dotyczące zamówienia lub produktów? Chętnie pomożemy!
        </p>
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
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Telefon</h3>
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="text-muted hover:text-primary transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Adres</h3>
                <p className="text-muted">
                  ul. Przykładowa 123<br />
                  00-000 Warszawa<br />
                  Polska
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Godziny pracy</h3>
                <p className="text-muted">
                  Poniedziałek - Piątek: 9:00 - 17:00<br />
                  Sobota: 10:00 - 14:00<br />
                  Niedziela: zamknięte
                </p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-medium text-foreground mb-4">Znajdziesz nas też na:</h3>
            <div className="flex gap-4">
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-background rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Instagram
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-background rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          <div className="bg-background rounded-xl p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Napisz do nas
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
