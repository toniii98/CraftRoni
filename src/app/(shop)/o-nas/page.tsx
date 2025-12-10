import { Metadata } from "next";
import { Heart, Users, Sparkles, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "O nas",
  description: "Poznaj historię CraftRoni i naszą misję wspierania polskiego rękodzieła",
};

const values = [
  {
    icon: Heart,
    title: "Pasja",
    description: "Każdy produkt w naszym sklepie to efekt pasji i miłości do tworzenia",
  },
  {
    icon: Users,
    title: "Wspólnota",
    description: "Wspieramy polskich twórców i budujemy społeczność miłośników rękodzieła",
  },
  {
    icon: Sparkles,
    title: "Unikalność",
    description: "Oferujemy produkty, które są jedyne w swoim rodzaju",
  },
  {
    icon: Award,
    title: "Jakość",
    description: "Stawiamy na najwyższą jakość materiałów i wykonania",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-red-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              O nas
            </h1>
            <p className="text-xl text-gray-600">
              CraftRoni to miejsce, gdzie polska tradycja rzemieślnicza spotyka się
              z nowoczesnym designem. Łączymy twórców z miłośnikami unikalnych,
              ręcznie robionych przedmiotów.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nasza historia
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  CraftRoni powstało z miłości do polskiego rękodzieła i chęci
                  dzielenia się tą pasją z innymi. Wierzymy, że ręcznie robione
                  przedmioty mają duszę - każdy z nich opowiada swoją historię.
                </p>
                <p>
                  Nasz sklep to miejsce, gdzie możesz znaleźć unikalne produkty
                  stworzone przez utalentowanych polskich twórców. Od biżuterii
                  przez ceramikę, po tekstylia - każdy przedmiot jest wyjątkowy.
                </p>
                <p>
                  Wspierając CraftRoni, wspierasz polskich rzemieślników i pomagasz
                  zachować tradycję, która przechodzi z pokolenia na pokolenie.
                </p>
              </div>
            </div>
            
            {/* Image placeholder */}
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
              <span className="text-gray-400">[Zdjęcie warsztatu]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nasze wartości
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              To, co nas wyróżnia i napędza do działania każdego dnia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-full mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Masz pytania?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Chętnie odpowiemy na wszystkie Twoje pytania. Skontaktuj się z nami!
          </p>
          <a
            href="/kontakt"
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Skontaktuj się z nami
          </a>
        </div>
      </section>
    </div>
  );
}
