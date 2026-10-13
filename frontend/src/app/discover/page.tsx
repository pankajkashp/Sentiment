import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";

const topics = [
  { name: "Digital government", description: "Digital Public Infrastructure, accessibility, offline fallbacks & privacy rights", count: "01" },
  { name: "Environment", description: "National Clean Air Action Plan, urban telemetry, water conservation & biodiversity", count: "02" },
  { name: "Health", description: "Rural telemedicine, Ayushman Bharat integration, primary health centres & drug availability", count: "03" },
  { name: "Economy", description: "Decentralized rooftop solar, micro-enterprise compliance, labor reforms & taxation", count: "04" },
  { name: "Public services", description: "Electric bus fleet networks, last-mile feeder routes & barrier-free accessibility", count: "05" },
  { name: "Education", description: "National Education Policy, vocational skills integration & vernacular instruction", count: "06" },
];

export default function DiscoverPage() {
  return (
    <main className="content-width min-h-screen py-8 pb-24 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--saffron)] transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to consultations
      </Link>

      <div className="mt-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--saffron)]">
          Explore Focus Areas
        </span>
        <h1 className="font-display mt-1 text-[26px] font-extrabold text-[var(--ink)] sm:text-[34px]">
          National Policy Consultation Sectors
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--body)]">
          Explore public consultation topics across key domains. Topics represent civic discussion categories, not claims about consensus.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(({ name, description, count }) => (
          <Link
            key={name}
            href={`/?category=${encodeURIComponent(name)}`}
            className="group rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--saffron)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono text-[var(--muted)]">
                {count} / 06
              </span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "var(--chakra-soft)", color: "var(--chakra)" }}
              >
                <Compass size={15} strokeWidth={2} aria-hidden="true" />
              </span>
            </div>

            <h2 className="font-display mt-6 text-[17px] font-bold text-[var(--ink)] group-hover:text-[var(--saffron)] transition-colors">
              {name}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--body)] line-clamp-2">
              {description}
            </p>

            <span
              className="mt-4.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--saffron)]"
            >
              <span>Explore discussions</span>
              <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
