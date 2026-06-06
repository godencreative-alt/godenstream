import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function DramaPopularPage() {
  return (
    <UnsupportedSection
      name="Drama Popular"
      reason="goden.store dracin only exposes latest and search."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
