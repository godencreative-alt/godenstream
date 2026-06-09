import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function PopularPage() {
  return (
    <UnsupportedSection
      name="Popular"
      reason="api.godenpg.dev does not expose a global popular feed. Browse Drama, Anime, or Movie instead."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
