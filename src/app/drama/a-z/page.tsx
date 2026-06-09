import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function DramaAlphabetPage() {
  return (
    <UnsupportedSection
      name="Drama A–Z"
      reason="The alphabet index is not exposed by api.godenpg.dev."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
