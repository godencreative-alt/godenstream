import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function MovieboxEpisodePage() {
  return (
    <UnsupportedSection
      name="Movie episodes"
      reason="api.godenpg.dev movies are single-source and do not have separate episodes."
      primaryHref="/moviebox"
      primaryLabel="Browse Movie"
    />
  );
}
