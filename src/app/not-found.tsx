import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-background">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
        <PackageX className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">
        Nie znaleziono strony
      </h1>
      <p className="text-muted mb-8 max-w-md">
        Strona, której szukasz, nie istnieje albo została przeniesiona.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Strona główna
        </Link>
        <Link
          href="/sklep"
          className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
        >
          Przejdź do sklepu
        </Link>
      </div>
    </div>
  );
}
