"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Settings,
  Store,
  Menu,
  X,
} from "lucide-react";
import { AdminLogoutButton } from "./AdminLogoutButton";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Produkty", href: "/admin/produkty", icon: Package },
  { name: "Zamówienia", href: "/admin/zamowienia", icon: ShoppingCart },
  { name: "Kategorie", href: "/admin/kategorie", icon: FolderTree },
  { name: "Ustawienia", href: "/admin/ustawienia", icon: Settings },
];

interface AdminShellProps {
  email: string;
  children: React.ReactNode;
}

/**
 * Szkielet panelu admina: stały sidebar na desktopie,
 * wysuwany drawer + górny pasek na telefonie.
 */
export function AdminShell({ email, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="font-serif text-xl font-bold text-primary">
          CraftRoni Admin
        </Link>
        <p className="text-xs text-white/60 mt-1 truncate">{email}</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {adminNavigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-white/75 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          <Store className="h-5 w-5" />
          Wróć do sklepu
        </Link>
        <AdminLogoutButton />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Górny pasek — tylko mobile */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-foreground text-white px-4 py-3">
        <Link href="/admin" className="font-serif text-lg font-bold text-primary">
          CraftRoni Admin
        </Link>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white/75 hover:text-white"
          aria-label="Otwórz menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar — desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-foreground text-white">
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile drawer */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/60"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-foreground text-white shadow-xl">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-white/75 hover:text-white"
              aria-label="Zamknij menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-4 sm:p-8">{children}</main>
    </div>
  );
}
