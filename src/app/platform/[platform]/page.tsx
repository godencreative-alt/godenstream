import UnsupportedSection from "@/components/shared/UnsupportedSection";

export default function PlatformPage() {
  return (
    <UnsupportedSection
      name="Platform aggregator"
      reason="The shordrama platform aggregator (Drama-ID, DramaBox, Melolo, NetShort, FreeReels) is not part of goden.store."
      primaryHref="/drama/browse"
      primaryLabel="Browse Drama"
    />
  );
}
