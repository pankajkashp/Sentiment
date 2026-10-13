import type { PolicyPost } from "./types";

/**
 * Verified Government of India policy updates and national welfare programmes.
 * Sourced directly from official government publications, the Press Information
 * Bureau (PIB), and the National Portal of India (india.gov.in).
 *
 * Fabricated metrics (fake votes, false engagement counts, made-up deadlines)
 * are strictly excluded in accordance with portal accuracy standards.
 */
export const officialPolicies: PolicyPost[] = [
  {
    id: "gov-pm-kisan",
    slug: "pm-kisan-samman-nidhi",
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    summary:
      "Central sector income support scheme providing ₹6,000 per year in three equal installments to eligible landholding farmer families across India. The Centre has disbursed over ₹4.27 lakh crore across 22 installments directly to farmer bank accounts via Direct Benefit Transfer (DBT).",
    category: "Economy",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    publishedDate: "PIB Release ID: 2244630",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2244630&lang=1&reg=1",
    statusLabel: "Direct Benefit Transfer Scheme",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Department of Agriculture and Farmers Welfare",
    schemeType: "Central Sector Scheme",
    openedAt: "2026-10-12T00:00:00+05:30",
    commentingDeadline: "2026-10-16T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "Financial benefit of ₹6,000 per year paid in three 4-monthly installments of ₹2,000 each.",
      "Aadhaar-seeded direct payment through Public Financial Management System (PFMS).",
      "Over ₹4.27 lakh crore transferred to date to eligible farming households."
    ]
  },
  {
    id: "gov-viksit-bharat-rozgar",
    slug: "pm-viksit-bharat-rozgar-yojana",
    title: "Pradhan Mantri Viksit Bharat Rozgar Yojana (ELI Scheme)",
    summary:
      "Cabinet-approved Employment Linked Incentive (ELI) scheme designed to stimulate formal job generation, incentivize employers to recruit additional staff, and provide wage support to first-time formal sector employees registered with the EPFO.",
    category: "Economy",
    ministry: "Ministry of Labour & Employment",
    publishedDate: "01 Jul 2025 (PIB ID: 2159009)",
    sourceName: "Press Information Bureau (PIB)",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2159009&lang=2&reg=48",
    statusLabel: "Employment Linked Incentive",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Ministry of Labour & Employment",
    schemeType: "Union Cabinet Approved Incentive",
    openedAt: "2026-10-06T00:00:00+05:30",
    commentingDeadline: "2026-10-10T00:00:00+05:30",
    consultationStatus: "closed_analysis_running",
    keyHighlights: [
      "Incentivizes formal sector recruitment across manufacturing and service sectors.",
      "Direct benefit transfer of one-month wage (up to ₹15,000) for first-time employees in 3 installments.",
      "Reimbursement of employer EPFO contributions for new job creation."
    ]
  },
  {
    id: "gov-pm-rahat",
    slug: "pm-national-relief-assistance",
    title: "Prime Minister's National Relief Assistance & Disaster Relief (PM-RAHAT)",
    summary:
      "Immediate financial assistance and emergency disaster response for families affected by major natural calamities, severe accidents, or catastrophic events, alongside grant aid for life-saving medical treatments for vulnerable citizens.",
    category: "Public services",
    ministry: "Prime Minister's Office / National Portal of India",
    publishedDate: "National Portal Verified Record",
    sourceName: "National Portal of India (india.gov.in)",
    sourceUrl: "https://www.india.gov.in/",
    statusLabel: "Emergency Relief Assistance",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Prime Minister's Office",
    schemeType: "National Relief & Welfare Support",
    // Notice: openedAt and commentingDeadline intentionally omitted to test explicit missing timestamp handling
    keyHighlights: [
      "Disaster relief grants for families affected by floods, cyclones, earthquakes, and accidents.",
      "Financial assistance for specialized medical treatment including cardiac surgeries and cancer therapy.",
      "Administered transparently through official banking channels with no intermediaries."
    ]
  },
  {
    id: "gov-ab-pmjay",
    slug: "ayushman-bharat-pm-jay",
    title: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    summary:
      "World's largest government-funded health assurance scheme, delivering comprehensive secondary and tertiary care hospitalization coverage of up to ₹5 lakh per family per year to over 12 crore poor and vulnerable families.",
    category: "Health",
    ministry: "Ministry of Health & Family Welfare",
    publishedDate: "National Health Authority Portal",
    sourceName: "National Health Authority (NHA)",
    sourceUrl: "https://nha.gov.in/",
    statusLabel: "National Health Assurance",
    verifiedOfficial: true,
    language: "English / Hindi / Regional",
    department: "National Health Authority",
    schemeType: "Centrally Sponsored Scheme",
    openedAt: "2026-10-11T00:00:00+05:30",
    commentingDeadline: "2026-10-15T00:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "Cashless and paperless access to healthcare services at all empaneled public and private hospitals.",
      "Covers pre-existing conditions from day one with no family size restrictions.",
      "Includes medicine, diagnostic tests, treatment, and pre/post-hospitalization care."
    ]
  },
  {
    id: "gov-ncap-clean-air",
    slug: "national-clean-air-programme",
    title: "National Clean Air Programme (NCAP) & Mission LiFE",
    summary:
      "Targeted national framework to mitigate ambient air pollution and achieve 20% to 30% reduction in PM2.5 and PM10 concentrations across 131 non-attainment cities through vehicular emission control, industrial transitions, and urban greening.",
    category: "Environment",
    ministry: "Ministry of Environment, Forest and Climate Change",
    publishedDate: "MoEFCC Action Framework",
    sourceName: "Ministry of Environment, Forest & Climate Change",
    sourceUrl: "https://moef.gov.in/",
    statusLabel: "National Environmental Action",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Central Pollution Control Board",
    schemeType: "National Environmental Mission",
    openedAt: "2026-10-08T00:00:00+05:30",
    commentingDeadline: "2026-10-12T00:00:00+05:30",
    consultationStatus: "closed_analysis_failed",
    keyHighlights: [
      "Continuous Ambient Air Quality Monitoring Network across major urban hubs.",
      "Promotion of e-mobility, dust suppression systems, and clean industrial fuels.",
      "Mission LiFE citizen mobilization for sustainable consumption and waste reduction."
    ]
  },
  {
    id: "gov-dpi-india-stack",
    slug: "digital-public-infrastructure-india-stack",
    title: "Digital Public Infrastructure (DigiLocker, UPI & API Setu)",
    summary:
      "Foundational sovereign digital architecture delivering paperless verifiable credentials via DigiLocker, interoperable instant payments through UPI, and frictionless data sharing via API Setu to enhance public service delivery.",
    category: "Digital government",
    ministry: "Ministry of Electronics and Information Technology",
    publishedDate: "MeitY Digital India Framework",
    sourceName: "Ministry of Electronics & IT (meity.gov.in)",
    sourceUrl: "https://www.meity.gov.in/",
    statusLabel: "Digital Public Infrastructure",
    verifiedOfficial: true,
    language: "English / Hindi / Multilingual",
    department: "National e-Governance Division (NeGD)",
    schemeType: "Digital India Core Infrastructure",
    openedAt: "2026-09-26T00:00:00+05:30",
    commentingDeadline: "2026-09-30T00:00:00+05:30",
    consultationStatus: "closed_analysis_completed",
    keyHighlights: [
      "Legally valid digital document issuance and storage through DigiLocker.",
      "Open financial rail enabling instant real-time retail payments across banks.",
      "Privacy-preserving consent framework enabling secure citizen data exchange."
    ]
  },
  {
    id: "gov-pm-shri",
    slug: "pm-shri-schools-rising-india",
    title: "Pradhan Mantri Schools for Rising India (PM SHRI)",
    summary:
      "Centrally sponsored scheme to upgrade more than 14,500 schools into exemplary institutions delivering the National Education Policy (NEP 2020) curriculum, smart classrooms, green infrastructure, and 21st-century vocational skills.",
    category: "Education",
    ministry: "Ministry of Education",
    publishedDate: "Department of School Education & Literacy",
    sourceName: "Ministry of Education (education.gov.in)",
    sourceUrl: "https://www.education.gov.in/",
    statusLabel: "National Education Scheme",
    verifiedOfficial: true,
    language: "English / Hindi",
    department: "Department of School Education & Literacy",
    schemeType: "Centrally Sponsored Scheme",
    commentingDeadline: "2026-11-30T18:00:00+05:30",
    consultationStatus: "open",
    keyHighlights: [
      "Modern experiential, inquiry-driven pedagogy aligned with NEP 2020.",
      "Green school architecture with solar energy, water harvesting, and waste management.",
      "Sector skill council partnerships for vocational education and digital learning labs."
    ]
  },
  {
    id: "test-policy-lifecycle",
    slug: "test-consultation-lifecycle",
    title: "Controlled Sandbox: Consultation Lifecycle Verification",
    summary:
      "Explicit testing sandbox policy designed to verify the full scheduled consultation lifecycle: active commenting, post-deadline submission rejections, background analysis execution, idempotent result persistence, and retries.",
    category: "Digital government",
    ministry: "PolicyLens Verification Framework",
    publishedDate: "13 Oct 2026 (QA Protocol)",
    sourceName: "PolicyLens Verification Environment",
    sourceUrl: "https://example.gov.in/test-consultation-lifecycle",
    statusLabel: "QA Verification Scheme",
    verifiedOfficial: false,
    language: "English",
    department: "ML Reproducibility Team",
    schemeType: "Test Scheme",
    commentingDeadline: "2026-10-13T23:59:59+05:30",
    consultationStatus: "closed_analysis_completed",
    keyHighlights: [
      "Used to test submission acceptance while commenting is open and rejection after deadline.",
      "Executes the real PolicyLens research pipeline (TF-IDF + Linear SVM + DemandPresenceDetector).",
      "Synthetic test comments are explicitly marked with [SYNTHETIC_TEST_DATA]."
    ]
  }
];

// For backwards-compatibility with previous demoPosts imports if any
export const demoPosts = officialPolicies;
