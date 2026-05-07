export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="mb-8 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Privacy Policy
      </h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/60">
        <p>Last updated: May 2026</p>
        <h2 className="text-lg font-semibold text-white">Information We Collect</h2>
        <p>We collect information you provide directly, such as account details. We also automatically collect device identifiers and usage data to improve our service.</p>
        <h2 className="text-lg font-semibold text-white">How We Use Information</h2>
        <p>We use collected information to provide, maintain, and improve our streaming services, including personalized recommendations and watch history.</p>
        <h2 className="text-lg font-semibold text-white">Data Storage</h2>
        <p>Watch history and bookmarks are stored locally on your device using localStorage. Account data is stored securely on our servers.</p>
        <h2 className="text-lg font-semibold text-white">Contact</h2>
        <p>For privacy inquiries, contact us at privacy@godenstream.example.com</p>
      </div>
    </div>
  );
}
