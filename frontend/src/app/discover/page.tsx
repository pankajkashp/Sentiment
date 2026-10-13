import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";

const topics = [
  ["Environment", "Air quality, sustainability, forest conservation, and climate action", "01"],
  ["Public services", "Direct citizen support, disaster relief, and infrastructure delivery", "02"],
  ["Economy", "Employment schemes, farmer income support, and manufacturing incentives", "03"],
  ["Health", "National health insurance, hospitalization coverage, and healthcare access", "04"],
  ["Digital government", "Digital Public Infrastructure, paperless credentials, and open data rails", "05"],
  ["Education", "Exemplary smart schools, NEP 2020 pedagogy, and skill development", "06"]
];

export default function DiscoverPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#E87518]">
        <ArrowLeft size={14} /> Back to Portal Home
      </Link>
      <div className="mt-6 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#143454] bg-[#e8eef5] px-2.5 py-1 rounded inline-block">
          Explore Policy Sectors
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#171717] leading-tight">
          Browse Government Policies by Topic
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#444444]">
          Explore verified Union Ministry schemes and public policy updates categorized by administrative domain.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(([name, description, index]) => (
          <Link
            key={name}
            href={`/?category=${encodeURIComponent(name)}#feed`}
            className="group rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-2xs transition-all hover:border-[#143454] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-[#9ca3af]">{index} / 06</span>
              <Compass size={18} className="text-[#E87518]" />
            </div>
            <h2 className="font-display mt-6 text-lg font-bold text-[#171717] group-hover:text-[#143454]">
              {name}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#666666]">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#143454] group-hover:text-[#E87518]">
              View Schemes <ArrowUpRight size={13} />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
