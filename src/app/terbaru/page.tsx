import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function TerbaruPage() {
  return (
    <UnsupportedSection
      name="Terbaru"
      reason="The unified latest feed has moved. Browse Drama, Anime, or Movie individually."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
