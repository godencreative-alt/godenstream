import Link from "next/link";
import { FilmIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <FilmIcon className="h-16 w-16 text-white/20" />
      <h2
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        404
      </h2>
      <p className="text-sm text-white/50">Page not found</p>
      <Link href="/">
        <Button variant="primary">Back to Home</Button>
      </Link>
    </div>
  );
}
