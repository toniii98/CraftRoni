import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderTree, 
  Settings,
  LogOut,
  Store
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Produkty", href: "/admin/produkty", icon: Package },
  { name: "Zamówienia", href: "/admin/zamowienia", icon: ShoppingCart },
  { name: "Kategorie", href: "/admin/kategorie", icon: FolderTree },
  { name: "Ustawienia", href: "/admin/ustawienia", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-foreground text-white">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="font-serif text-xl font-bold text-primary">
            CraftRoni Admin
          </Link>
          {session && (
            <p className="text-xs text-white/60 mt-1 truncate">
              {session.email}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {adminNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-white/75 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
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
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
