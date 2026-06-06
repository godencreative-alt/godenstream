import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function AnimePopularPage() {
  return (
    <UnsupportedSection
      name="Anime Popular"
      reason="goden.store anime only exposes latest and search."
      primaryHref="/anime"
      primaryLabel="Browse Anime"
    />
  );
}
