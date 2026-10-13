import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Scale,
  Shield,
} from "lucide-react";
import { ParliamentIcon } from "@/components/brand/parliament-icon";

const principles = [
  {
    icon: BookOpen,
    title: "Evidence Over Assertion",
    text: "Every collective insight in PolicyLens is anchored directly to verbatim citizen comments and traceable citation IDs. We do not synthesize opinions without evidence.",
  },
  {
    icon: Scale,
    title: "A Concern is Not a Demand",
    text: "PolicyLens explicitly distinguishes citizen concerns and grievances from actionable policy demands, preventing automated systems from inventing requested reforms.",
  },
  {
    icon: Shield,
    title: "Integrity & Anti-Sybil Standards",
    text: "Discussions follow a one-account, one-reaction rule. Layered behavioral signals and verifiable provenance safeguard the consultation against automated manipulation.",
  },
  {
    icon: FileCheck,
    title: "Transparent Uncertainty Reporting",
    text: "Provisional public sentiment is clearly distinguished from validated empirical research. Low-sample clusters and ambiguous feedback are flagged rather than smoothed over.",
  },
];

export default function AboutPage() {
  return (
    <main className="content-width min-h-screen py-8 pb-24 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--saffron)] transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to consultations
      </Link>

      <div className="mt-8 flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--line)",
            color: "var(--chakra)",
          }}
        >
          <ParliamentIcon size={22} />
        </span>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--saffron)]">
            About the Platform
          </span>
          <h1 className="font-display text-[26px] font-extrabold text-[var(--ink)] sm:text-[34px]">
            PolicyLens Architecture & Principles
          </h1>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[var(--body)]">
        PolicyLens is an evidence-first public-policy portal designed to synthesize thousands of public consultation comments into traceable collective verdicts without collapsing minority dissent or inventing unsupported demands.
      </p>

      {/* Core Principles Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {principles.map(({ icon: Icon, title, text }) => (
          <section
            key={title}
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--chakra-soft)", color: "var(--chakra)" }}
              >
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[var(--ink)]">
                {title}
              </h2>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--body)]">
              {text}
            </p>
          </section>
        ))}
      </div>

      {/* Academic Independence & Disclaimers Box */}
      <div
        className="mt-8 rounded-2xl border p-6"
        style={{
          background: "var(--surface-subtle)",
          borderColor: "var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[var(--india-green)]" aria-hidden="true" />
          <h2 className="font-display text-[16px] font-bold text-[var(--ink)]">
            Independence & Governance Notice
          </h2>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--body)]">
          PolicyLens is an independent academic research platform. It is not an official government body and does not represent any ministry or government agency. Consultation drafts on this platform are demonstration models for evaluating Natural Language Processing (NLP) safeguards in civic engagement.
        </p>
      </div>
    </main>
  );
}
