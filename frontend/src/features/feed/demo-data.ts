import type { PolicyPost } from "./types";

/**
 * Explicitly fictional visual-demo content. Replace with API data when the
 * backend is implemented. Never treat these sample counts as research evidence.
 */
export const demoPosts: PolicyPost[] = [
  {
    id: "demo-policy-01",
    slug: "urban-green-spaces",
    title: "Who gets a say in the future of our cities?",
    excerpt: "A consultation on urban green spaces, heat resilience and how neighbourhood investment decisions are made.",
    category: "Environment",
    publishedAt: "2026-10-13T08:00:00.000Z",
    closesAt: "2026-10-16T18:00:00.000Z",
    comments: 128,
    participation: "Open for discussion",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Tree-lined city park and surrounding buildings",
    status: "Closing soon",
    sourceName: "City policy consultation",
    sourceUrl: "#source-urban-green-spaces",
    language: "English"
  },
  {
    id: "demo-policy-02",
    slug: "public-transport-access",
    title: "Reliable transport should not depend on your postcode",
    excerpt: "How should public transport funding balance reliability, affordability and service to underserved communities?",
    category: "Public services",
    publishedAt: "2026-10-12T12:00:00.000Z",
    closesAt: "2026-10-17T18:00:00.000Z",
    comments: 94,
    participation: "Open for discussion",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Commuter train travelling through a city",
    status: "Open",
    sourceName: "Public transport review",
    sourceUrl: "#source-public-transport",
    language: "English"
  },
  {
    id: "demo-policy-03",
    slug: "digital-public-services",
    title: "Make digital public services work for everyone",
    excerpt: "Share perspectives on accessibility, language support, privacy and alternatives for people who cannot get online.",
    category: "Digital government",
    publishedAt: "2026-10-11T10:00:00.000Z",
    closesAt: "2026-10-15T18:00:00.000Z",
    comments: 76,
    participation: "Open for discussion",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Person working on a laptop at a desk",
    status: "Closing soon",
    sourceName: "Digital access consultation",
    sourceUrl: "#source-digital-access",
    language: "English"
  }
];
