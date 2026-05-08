import Link from "next/link";

const links = [
  { href: "/konto", label: "Panel" },
  { href: "/konto/dane", label: "Dane konta" },
  { href: "/konto/adresy", label: "Adresy" },
  { href: "/konto/zamowienia", label: "Moje zamówienia" },
];

export function AccountNav() {
  return (
    <nav className="rounded-xl border border-border bg-surface p-4">
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
