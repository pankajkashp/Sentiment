import Link from "next/link";
import { ParliamentIcon } from "./parliament-icon";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
      aria-label="PolicyLens — Indian Public Policy Portal Home"
    >
      <span
        className="relative flex h-9 w-9 flex-col items-center justify-center overflow-hidden rounded-xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          color: "var(--chakra)",
        }}
      >
        <ParliamentIcon size={19} className="translate-y-[-1px]" />
        <span
          className="absolute inset-x-0 bottom-0 h-[2.5px]"
          style={{
            background:
              "linear-gradient(90deg, var(--saffron) 0 33.33%, #ffffff 33.33% 66.67%, var(--india-green) 66.67% 100%)",
          }}
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[18px] font-extrabold tracking-[-0.04em] text-[var(--ink)]">
          PolicyLens
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Public Policy Portal
          </span>
        )}
      </span>
    </Link>
  );
}
