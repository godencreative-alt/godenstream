import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function TrendingPage() {
  return (
    <UnsupportedSection
      name="Trending"
      reason="api.godenpg.dev does not expose a global trending feed. Browse Drama, Anime, or Movie instead."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
