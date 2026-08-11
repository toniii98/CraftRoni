import { Metadata } from "next";

export const metadata: Metadata = {
  title: "O mnie",
  description: "Poznaj Weronikę i historię marki craft.roni",
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-red-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              O mnie
            </h1>
            <p className="text-xl text-muted">
              Hej! Tu craft.roni — marka, która powstała z miłości do tworzenia,
              szycia i wyszukiwania skarbów tam, gdzie inni widzą tylko stare rzeczy.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Moja historia
              </h2>
              <div className="space-y-4 text-muted">
                <p>
                  Jestem jednoosobowym zespołem ze mną — Weroniką na czele. Tworzę
                  projekty metodą prób i błędów, ucząc się każdego dnia i dając
                  drugie życie materiałom, które mają już swoją historię. Z kawałków
                  tkanin, ubrań z przeszłością i odrobiny wyobraźni powstają rzeczy
                  wyjątkowe: ręcznie robione, praktyczne i stworzone z myślą o tym,
                  żeby służyć Ci na co dzień.
                </p>
                <p>
                  Całe czary-mary odbywają się w mieszkaniu, na domowej maszynie do
                  szycia na warszawskim Bemowie.
                </p>
                <p>
                  Wszystkie produkty są szyte tylko w jednym egzemplarzu, z dbałością
                  o najmniejszy detal. Tworzę powoli, z uważnością, wierząc, że rzeczy
                  wykonane z pasją mają swoją wyjątkową historię i zostają z nami na
                  dłużej.
                </p>
              </div>
            </div>
            
            {/* Image placeholder */}
            <div className="aspect-square bg-background rounded-2xl flex items-center justify-center">
              <span className="text-muted">[Zdjęcie warsztatu]</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
