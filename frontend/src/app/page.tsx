"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ShieldAlert, PhoneCall, Building2, CheckCircle2, Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { GovHeader } from "@/components/navigation/gov-header";
import { PolicyCard } from "@/features/feed/policy-card";
import { officialPolicies } from "@/features/feed/demo-data";
import { FeedToolbar, SortTimeFilter, TopicCategory } from "@/features/feed/feed-toolbar";
import { InstitutionIllustration } from "@/components/brand/institution-illustration";

export default function HomePage() {
  const [sortTime, setSortTime] = useState<SortTimeFilter>("Latest");
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory>("All topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All languages");

  const filteredPolicies = useMemo(() => {
    let list = [...officialPolicies];

    // Filter by topic category
    if (selectedTopic !== "All topics") {
      list = list.filter((p) => p.category === selectedTopic);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.ministry.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Filter by language
    if (selectedLanguage !== "All languages") {
      list = list.filter((p) =>
        p.language.toLowerCase().includes(selectedLanguage.toLowerCase())
      );
    }

    // Sort time handling
    if (sortTime === "Trending") {
      // Prioritize flagship nationwide schemes with most highlights
      list.sort((a, b) => (b.keyHighlights?.length || 0) - (a.keyHighlights?.length || 0));
    } else if (sortTime === "Last 24 hours") {
      // Show prioritized urgent and recent releases
      list = list.filter(
        (p) =>
          p.id === "gov-pm-kisan" ||
          p.id === "gov-viksit-bharat-rozgar" ||
          p.id === "gov-pm-rahat"
      );
    }

    return list;
  }, [sortTime, selectedTopic, searchQuery, selectedLanguage]);

  const handleReset = () => {
    setSortTime("Latest");
    setSelectedTopic("All topics");
    setSearchQuery("");
    setSelectedLanguage("All languages");
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#171717]">
      {/* 1. Header & Navigation (White Masthead + Navy Blue Navigation Bar) */}
      <GovHeader />

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
        {/* 2. Compact Government Portal Introduction Banner */}
        <section className="mb-5 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-[#143454] bg-[#e8eef5]">
                <CheckCircle2 size={13} className="text-[#16834A]" />
                <span>Verified Public Policy &amp; Programme Directory</span>
              </div>
              <h1 className="font-display text-[22px] sm:text-[28px] font-extrabold tracking-tight text-[#171717] leading-tight">
                National Policy Updates &amp; Welfare Schemes Repository
              </h1>
              <p className="text-[13px] leading-relaxed text-[#444444] max-w-2xl">
                Access official Government of India welfare schemes, direct benefit transfers,
                and ministry releases verified from the Press Information Bureau (PIB) and the
                National Portal of India. All updates directly cite authenticated government documents.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#666666]">
                <span className="flex items-center gap-1 text-[#16834A] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16834A]" />
                  Zero Fabricated Metrics
                </span>
                <span>•</span>
                <span>Direct Primary Source Citations</span>
                <span>•</span>
                <span>Multilingual Access</span>
              </div>
            </div>

            {/* Clean Architectural Illustration */}
            <div className="lg:col-span-5">
              <InstitutionIllustration />
            </div>
          </div>
        </section>

        {/* 3. Main Content Grid (Feed + Sidebar) */}
        <div id="feed" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Feed Toolbar & Policy Cards */}
          <section className="lg:col-span-8 space-y-4">
            {/* Compact Feed Toolbar with required exact tabs */}
            <FeedToolbar
              sortTime={sortTime}
              onSortTimeChange={setSortTime}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              onReset={handleReset}
              totalCount={filteredPolicies.length}
            />

            {/* Policy Cards List */}
            <div className="space-y-3.5">
              {filteredPolicies.map((post, idx) => (
                <PolicyCard
                  key={post.id}
                  post={post}
                  featured={idx === 0 && selectedTopic === "All topics" && !searchQuery}
                />
              ))}

              {filteredPolicies.length === 0 && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-10 text-center space-y-3">
                  <Search size={28} className="mx-auto text-[#9ca3af]" />
                  <h3 className="font-display text-lg font-bold text-[#171717]">
                    No policy updates match your filters
                  </h3>
                  <p className="text-[13px] text-[#666666] max-w-sm mx-auto">
                    Try clearing your search query or selecting &quot;All topics&quot; to view all available government updates.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#E87518] px-4 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#c25e0e] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal size={13} />
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Independent Civic Platform Clarification */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-3.5 text-[11px] leading-relaxed text-[#666666] flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-[#E87518] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#171717]">Public Information Notice:</strong> This portal provides an independent, structured directory of official public policies for citizen research and public information. All links navigate to authenticated publications on <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[#171717]">pib.gov.in</code>, <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[#171717]">india.gov.in</code>, and respective ministry domains.
              </div>
            </div>
          </section>

          {/* Right Column: Institutional Directory & Official Portals */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Official Portals Index */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f3f5]">
                <h3 className="font-display text-[14px] font-bold text-[#171717] flex items-center gap-2">
                  <Building2 size={16} className="text-[#143454]" />
                  Official National Portals
                </h3>
                <span className="text-[10px] uppercase font-bold text-[#16834A] bg-[#e6f4ea] px-1.5 py-0.5 rounded">Verified</span>
              </div>
              <ul className="mt-3 space-y-2 text-[12px]">
                {[
                  { name: "National Portal of India", url: "https://www.india.gov.in/", desc: "Single entry portal to all Indian Govt services" },
                  { name: "Press Information Bureau (PIB)", url: "https://www.pib.gov.in/", desc: "Official press releases and government updates" },
                  { name: "MyGov India", url: "https://www.mygov.in/", desc: "Citizen engagement and crowdsourced policy inputs" },
                  { name: "Digital India Initiative", url: "https://www.digitalindia.gov.in/", desc: "Flagship public digital transformation initiatives" },
                  { name: "Open Government Data (OGD)", url: "https://data.gov.in/", desc: "Open datasets published by Union Ministries" }
                ].map((portal) => (
                  <li key={portal.name} className="border-b border-[#f8fafc] pb-2 last:border-0 last:pb-0">
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between gap-2 hover:text-[#E87518]"
                    >
                      <div>
                        <span className="font-semibold text-[#171717] group-hover:text-[#E87518] flex items-center gap-1">
                          {portal.name}
                          <ArrowUpRight size={11} className="text-[#9ca3af] group-hover:text-[#E87518]" />
                        </span>
                        <p className="text-[10px] text-[#666666] leading-tight mt-0.5">{portal.desc}</p>
                      </div>
                      <ExternalLink size={11} className="text-[#9ca3af] shrink-0 mt-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Essential Citizen Helplines */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-2xs">
              <h3 className="font-display text-[14px] font-bold text-[#171717] flex items-center gap-2 pb-2 border-b border-[#f1f3f5]">
                <PhoneCall size={15} className="text-[#E87518]" />
                National Citizen Helplines
              </h3>
              <div className="mt-3 space-y-2 text-[12px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#f9fafb] border border-[#f1f3f5]">
                  <div>
                    <span className="block font-semibold text-[#171717]">Emergency Helpline</span>
                    <span className="text-[10px] text-[#666666]">Police, Fire, Ambulance</span>
                  </div>
                  <span className="font-mono font-bold text-[14px] text-[#143454] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">112</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#f9fafb] border border-[#f1f3f5]">
                  <div>
                    <span className="block font-semibold text-[#171717]">National Health Authority</span>
                    <span className="text-[10px] text-[#666666]">Ayushman Bharat (PM-JAY)</span>
                  </div>
                  <span className="font-mono font-bold text-[14px] text-[#143454] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">14555</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#f9fafb] border border-[#f1f3f5]">
                  <div>
                    <span className="block font-semibold text-[#171717]">Kisan Call Centre</span>
                    <span className="text-[10px] text-[#666666]">Agriculture queries &amp; support</span>
                  </div>
                  <span className="font-mono font-bold text-[14px] text-[#143454] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">1800-180-1551</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#f9fafb] border border-[#f1f3f5]">
                  <div>
                    <span className="block font-semibold text-[#171717]">National Consumer Helpline</span>
                    <span className="text-[10px] text-[#666666]">Grievances &amp; redressal</span>
                  </div>
                  <span className="font-mono font-bold text-[14px] text-[#143454] bg-white px-2 py-0.5 rounded border border-[#e5e7eb]">1915</span>
                </div>
              </div>
            </div>

            {/* Portal Notice and Guidelines */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-[11px] text-[#666666] space-y-2">
              <span className="font-bold text-[#143454] uppercase tracking-wider block">Portal Standards</span>
              <p className="leading-relaxed">
                All listed policy documents are public government publications. Summaries are strictly factual, free of personal bias, and provide unmediated access to Union ministry resources.
              </p>
              <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-[10px]">
                <Link href="/about" className="font-semibold text-[#E87518] hover:underline">About This Portal</Link>
                <span>© 2026 Public Policy Portal</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#e5e7eb] bg-white text-[#555555] text-[11px] py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[#171717]">सार्वजनिक नीति पोर्टल — PUBLIC POLICY PORTAL</span>
            <span className="text-[#666666]">
              Independent Civic Information Repository • Sourced from official Union Ministry publications
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#666666]">
            <Link href="/" className="hover:text-[#171717]">Home</Link>
            <Link href="/about" className="hover:text-[#171717]">About</Link>
            <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#171717]">india.gov.in</a>
            <a href="https://www.pib.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#171717]">pib.gov.in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
