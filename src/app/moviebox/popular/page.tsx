import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function MovieboxPopularPage() {
  return (
    <UnsupportedSection
      name="Movie Popular"
      reason="api.godenpg.dev entertainment endpoint mendukung latest, popular, dan search."
      primaryHref="/moviebox"
      primaryLabel="Browse Movie"
    />
  );
}
