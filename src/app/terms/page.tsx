export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="mb-8 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Terms of Service
      </h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/60">
        <p>Last updated: May 2026</p>
        <h2 className="text-lg font-semibold text-white">Acceptance</h2>
        <p>By using DramaShort, you agree to these terms. If you do not agree, please do not use the service.</p>
        <h2 className="text-lg font-semibold text-white">Service Description</h2>
        <p>DramaShort provides streaming access to short dramas across Drama-ID, DramaBox, Melolo, NetShort, and DramaNova.</p>
        <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
        <p>Some content requires a paid subscription. Plans include Free, Starter, and Premium tiers with varying access levels.</p>
        <h2 className="text-lg font-semibold text-white">Content</h2>
        <p>All content is provided by third-party providers. We do not claim ownership of the content streamed through our platform.</p>
      </div>
    </div>
  );
}
