import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function MovieboxPopularPage() {
  return (
    <UnsupportedSection
      name="Movie Popular"
      reason="goden.store movie only exposes latest and search."
      primaryHref="/moviebox"
      primaryLabel="Browse Movie"
    />
  );
}
