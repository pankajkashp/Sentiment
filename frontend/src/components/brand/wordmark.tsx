import Link from "next/link";
import { Aperture } from "lucide-react";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="PolicyLens home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent)", color: "var(--surface)" }}>
        <Aperture size={20} strokeWidth={1.8} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-extrabold tracking-[-.055em]">PolicyLens</span>
        {!compact && <span className="mt-1 text-[9px] font-semibold uppercase tracking-[.18em] muted">Public voice, clearly seen</span>}
      </span>
    </Link>
  );
}
