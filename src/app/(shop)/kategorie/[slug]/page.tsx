import { redirect } from "next/navigation";

// Adresy /kategorie/[slug] przekierowują do sklepu z filtrem kategorii —
// jedna strona listy produktów zamiast dwóch.
export default async function CategoryRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/sklep?kategoria=${encodeURIComponent(slug)}`);
}
