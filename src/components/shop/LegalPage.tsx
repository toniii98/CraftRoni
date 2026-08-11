import { AlertTriangle } from "lucide-react";

interface LegalPageProps {
  title: string;
  /** Pokazuje żółte ostrzeżenie, że treść to szablon do uzupełnienia. */
  isTemplate?: boolean;
  children: React.ReactNode;
}

/** Wspólny układ stron informacyjno-prawnych (regulamin, prywatność itd.). */
export function LegalPage({ title, isTemplate = true, children }: LegalPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-8">{title}</h1>

      {isTemplate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            <strong>Szablon do uzupełnienia.</strong> Ten dokument zawiera miejsca
            oznaczone jako [UZUPEŁNIJ], które przed uruchomieniem sklepu trzeba
            wypełnić danymi firmy i zweryfikować (najlepiej z prawnikiem). Po
            uzupełnieniu usuń to ostrzeżenie z kodu strony.
          </p>
        </div>
      )}

      <div className="space-y-8 text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:text-muted [&_p]:leading-relaxed [&_p]:mb-2 [&_li]:text-muted [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:space-y-1 [&_ol]:space-y-1">
        {children}
      </div>
    </div>
  );
}
