import type { PolicyPost } from "./types";

/**
 * Five recent items curated from Ministry of Home Affairs official release listings.
 * These are public information items, not open Government consultations. PolicyLens
 * commenting windows below are portal-configured and do not represent government deadlines.
 */
export const officialPolicies: PolicyPost[] = [
  {
    id: "mha-prahaar-ct-policy",
    slug: "prahaar-counter-terrorism-policy",
    title: "PRAHAAR — National Counter-Terrorism Policy & Strategy",
    summary: "The Ministry of Home Affairs describes PRAHAAR as a national counter-terrorism framework organized around prevention, response, coordinated capacity, human rights and rule-of-law safeguards, international cooperation, and recovery and resilience.",
    category: "Public services",
    ministry: "Ministry of Home Affairs",
    publishedDate: "28 Sep 2026",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2316153",
    statusLabel: "National Security Strategy",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Internal Security",
    schemeType: "National policy and strategy",
    openedAt: "2026-10-14T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "Seven pillars include prevention, response, internal coordination, human rights, international cooperation, and recovery and resilience.",
      "The release notes the launch of an Extradition Portal to coordinate efforts to bring fugitives back to India.",
      "The source is an official MHA release carried by the Press Information Bureau."
    ]
  },
  {
    id: "mha-special-campaign-6",
    slug: "special-campaign-6-mha",
    title: "Special Campaign 6 — Cleanliness, Grievances and Record Management",
    summary: "The Ministry of Home Affairs is participating in Special Campaign 6, which includes cleaner and more sustainable workplaces, improved record management, and the timely disposal of public grievances and pending references.",
    category: "Public services",
    ministry: "Ministry of Home Affairs",
    publishedDate: "23 Sep 2026",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2313801",
    statusLabel: "Public Administration",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Administration",
    schemeType: "Government campaign",
    openedAt: "2026-10-14T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "Implementation phase is listed as 2–31 October 2026 in the release.",
      "Focus areas include pending public grievances, appeals, parliamentary references, and record management.",
      "MHA says field and outstation offices that directly interface with the public receive special attention."
    ]
  },
  {
    id: "mha-narcotics-roadmap",
    slug: "drug-free-india-narcotics-roadmap",
    title: "Drug-Free India Roadmap (2026–2029)",
    summary: "An MHA release on narcotics control describes a three-year roadmap running from July 2026 to July 2029, with work across enforcement, synthetic-drug control, demand and harm reduction, and institutional capacity and coordination.",
    category: "Public services",
    ministry: "Ministry of Home Affairs",
    publishedDate: "6 Sep 2026",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2307200",
    statusLabel: "Narcotics Control",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Narcotics Control",
    schemeType: "National action roadmap",
    openedAt: "2026-10-14T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "The four pillars cover enforcement, precursor and synthetic drugs, demand and harm reduction, and capacity building.",
      "The release describes coordination among central agencies and state governments.",
      "The source describes a Government roadmap; the PolicyLens commenting period is separate and independent."
    ]
  },
  {
    id: "mha-intelligent-traffic-management",
    slug: "delhi-intelligent-traffic-management",
    title: "Delhi Intelligent Traffic Management System",
    summary: "A Cabinet-approved project will use adaptive traffic signals, technology-based enforcement, and real-time traffic information across identified Delhi corridors, with support for emergency vehicle movement and incident response.",
    category: "Digital government",
    ministry: "Ministry of Home Affairs",
    publishedDate: "30 Sep 2026",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2316955",
    statusLabel: "Urban Mobility",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Delhi Police",
    schemeType: "Intelligent traffic management project",
    openedAt: "2026-10-14T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "The release states an approved project cost of ₹1,789.52 crore.",
      "The system is planned for 42 traffic corridors and three implementation phases over 24 months.",
      "Plans include adaptive traffic signals, incident detection, and priority movement for ambulances and emergency vehicles."
    ]
  },
  {
    id: "mha-immigration-ivfRT",
    slug: "immigration-visa-foreigners-registration-tracking",
    title: "Immigration, Visa, Foreigners Registration & Tracking (IVFRT)",
    summary: "The Union Cabinet approved continuation of IVFRT for five years from 1 April 2026 to 31 March 2031. The platform is intended to connect immigration, visa issuance, and foreigner registration and tracking services.",
    category: "Digital government",
    ministry: "Ministry of Home Affairs",
    publishedDate: "25 Mar 2026",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2245101",
    statusLabel: "Immigration Services",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Immigration",
    schemeType: "Digital public service scheme",
    openedAt: "2026-10-14T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "The continuation period is 1 April 2026 through 31 March 2031.",
      "The release states a budget outlay of ₹1,800 crore.",
      "The platform's stated aim is integrated service delivery for legitimate travellers while supporting national security."
    ]
  }
];

/** Backwards compatibility for older frontend imports. */
export const demoPosts = officialPolicies;
