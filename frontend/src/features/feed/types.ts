export type PolicyCategory =
  | "Environment"
  | "Public services"
  | "Economy"
  | "Health"
  | "Digital government"
  | "Education";

export type PolicyPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: PolicyCategory;
  ministry: string;
  publishedDate: string; // Verified release / launch date from official records
  sourceName: string;
  sourceUrl: string;
  statusLabel: string;
  verifiedOfficial: boolean;
  language: string;
  keyHighlights: string[];
  department?: string;
  schemeType?: string;
};
