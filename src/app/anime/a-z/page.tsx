import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function AnimeAlphabetPage() {
  return (
    <UnsupportedSection
      name="Anime A–Z"
      reason="The alphabet index is not exposed by api.godenpg.dev."
      primaryHref="/anime"
      primaryLabel="Browse Anime"
    />
  );
}
