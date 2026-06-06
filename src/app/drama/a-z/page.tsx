import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function DramaAlphabetPage() {
  return (
    <UnsupportedSection
      name="Drama A–Z"
      reason="The alphabet index is not exposed by goden.store."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
