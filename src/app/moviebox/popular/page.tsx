import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function MovieboxPopularPage() {
  return (
    <UnsupportedSection
      name="Movie Popular"
      reason="goden.store entertainment endpoint hanya mendukung latest dan search."
      primaryHref="/moviebox"
      primaryLabel="Browse Movie"
    />
  );
}
