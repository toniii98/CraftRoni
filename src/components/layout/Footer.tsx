import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/config";

const footerLinks = {
  sklep: [
    { name: "Wszystkie produkty", href: "/sklep" },
    { name: "Nowości", href: "/sklep?sort=newest" },
    { name: "Bestsellery", href: "/sklep?sort=popular" },
    { name: "Promocje", href: "/sklep?sale=true" },
  ],
  informacje: [
    { name: "O nas", href: "/o-nas" },
    { name: "Dostawa i płatność", href: "/dostawa" },
    { name: "Zwroty i reklamacje", href: "/zwroty" },
    { name: "Regulamin", href: "/regulamin" },
    { name: "Polityka prywatności", href: "/prywatnosc" },
  ],
  kategorie: [
    { name: "Biżuteria", href: "/kategorie/bizuteria" },
    { name: "Ceramika", href: "/kategorie/ceramika" },
    { name: "Tekstylia", href: "/kategorie/tekstylia" },
    { name: "Dekoracje", href: "/kategorie/dekoracje" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-red-500">
              {siteConfig.name}
            </Link>
            <p className="text-sm text-gray-400">
              {siteConfig.description}
            </p>
            
            {/* Social links */}
            <div className="flex space-x-4 pt-4">
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Sklep links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Sklep</h3>
            <ul className="space-y-2">
              {footerLinks.sklep.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informacje links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informacje</h3>
            <ul className="space-y-2">
              {footerLinks.informacje.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-red-500" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-red-500" />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-start space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                <span className="text-gray-400">
                  Polska
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500">
              © {currentYear} {siteConfig.name}. Wszystkie prawa zastrzeżone.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Płatności obsługuje Przelewy24
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
