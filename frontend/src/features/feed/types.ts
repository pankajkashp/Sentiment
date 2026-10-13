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
  excerpt: string;
  category: PolicyCategory;
  publishedAt: string;
  closesAt: string;
  comments: number;
  participation: string;
  status: "Open" | "Closing soon";
  sourceName: string;
  sourceUrl: string;
  language:
    | "English"
    | "Hindi"
    | "Hinglish"
    | "Bengali"
    | "Tamil"
    | "Telugu"
    | "Marathi"
    | "Punjabi"
    | "Gujarati"
    | "Kannada"
    | "Malayalam"
    | "Urdu"
    | "Other";
  demandsCount?: number;
  concernsCount?: number;
  verifiedEvidenceCount?: number;
};
