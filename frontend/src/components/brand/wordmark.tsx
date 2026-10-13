import Link from "next/link";
import { Landmark } from "lucide-react";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="PolicyLens home">
      <span className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }}>
        <Landmark size={20} strokeWidth={1.8} />
        <span className="india-tricolour w-5 rounded-full" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-extrabold tracking-[-.055em]">PolicyLens</span>
        {!compact && <span className="mt-1 text-[9px] font-semibold uppercase tracking-[.18em] muted">Public issues, clearly seen</span>}
      </span>
    </Link>
  );
}
