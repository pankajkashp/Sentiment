"use client";

import {
  Calendar,
  Clock,
  Globe2,
  RotateCcw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import type { PolicyCategory } from "./types";

export type SortOption = "Latest" | "Trending";
export type TimeRangeOption = "All" | "24h" | "7d" | "30d";

export const CATEGORIES: (PolicyCategory | "All topics")[] = [
  "All topics",
  "Digital government",
  "Environment",
  "Health",
  "Economy",
  "Public services",
  "Education",
];

export const LANGUAGES = [
  "All languages",
  "English",
  "Hindi",
  "Hinglish",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Punjabi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Urdu",
  "Other",
];

interface FeedToolbarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (time: TimeRangeOption) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function FeedToolbar({
  sort,
  onSortChange,
  timeRange,
  onTimeRangeChange,
  language,
  onLanguageChange,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  onReset,
  isFiltered,
}: FeedToolbarProps) {
  return (
    <div
      className="glass-panel mb-5 rounded-2xl p-3.5 sm:p-4"
      role="search"
      aria-label="Filter and sort policy discussions"
    >
      {/* Search Bar on Mobile / Tablet */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 md:hidden" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <Search size={14} className="text-[var(--muted)] shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search policy issues..."
          className="w-full bg-transparent text-[12.5px] text-[var(--ink)] placeholder-[var(--muted)] outline-none"
          aria-label="Search discussions"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="Clear search text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Primary Toolbar Controls: Sort, Time Range, Language, Reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort: Latest vs Trending */}
        <div
          className="inline-flex rounded-xl border p-0.5"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          role="radiogroup"
          aria-label="Sort discussions"
        >
          <button
            type="button"
            role="radio"
            aria-checked={sort === "Latest"}
            onClick={() => onSortChange("Latest")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: sort === "Latest" ? "var(--saffron)" : "transparent",
              color: sort === "Latest" ? "#ffffff" : "var(--muted)",
            }}
          >
            <Clock size={12.5} strokeWidth={2} aria-hidden="true" />
            <span>Latest</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sort === "Trending"}
            onClick={() => onSortChange("Trending")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: sort === "Trending" ? "var(--saffron)" : "transparent",
              color: sort === "Trending" ? "#ffffff" : "var(--muted)",
            }}
          >
            <TrendingUp size={12.5} strokeWidth={2} aria-hidden="true" />
            <span>Trending</span>
          </button>
        </div>

        {/* Time Range Selector */}
        <label
          className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <Calendar size={12.5} className="text-[var(--muted)]" aria-hidden="true" />
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as TimeRangeOption)}
            className="bg-transparent text-[var(--ink)] outline-none cursor-pointer"
            aria-label="Select time range"
          >
            <option value="All">All time</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past 7 days</option>
            <option value="30d">Past 30 days</option>
          </select>
        </label>

        {/* Language Selector */}
        <label
          className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <Globe2 size={12.5} className="text-[var(--muted)]" aria-hidden="true" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="max-w-[120px] sm:max-w-[140px] bg-transparent text-[var(--ink)] outline-none cursor-pointer"
            aria-label="Filter by language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--saffron)] hover:text-[var(--saffron)]"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            aria-label="Reset all filters"
            title="Reset filters to default"
          >
            <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Horizontally Scrollable Topic Pills */}
      <div
        className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none"
        role="tablist"
        aria-label="Filter by policy topic"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onCategoryChange(cat)}
              className="shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all"
              style={{
                background: isSelected ? "var(--saffron)" : "var(--surface)",
                color: isSelected ? "#ffffff" : "var(--body)",
                borderColor: isSelected ? "var(--saffron)" : "var(--line)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
