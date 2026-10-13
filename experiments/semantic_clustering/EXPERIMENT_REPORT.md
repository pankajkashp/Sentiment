# PolicyLens Research Report: Semantic Feedback Grouping & Issue Summarization

**Experiment Directory:** `experiments/semantic_clustering/`  
**Date:** 2026-10-13  
**Status:** Completed  
**Objective:** Advance PolicyLens toward producing an evidence-backed collective verdict from unstructured public consultation feedback comments.

---

## 1. Usable Real Feedback Data Audit

### 1.1 Dataset Identification & Origin
- **Source:** *Open Government Consultation 2017–18 Get Involved Questionnaire* (Treasury Board of Canada Secretariat).
- **Cleaned File:** `data/processed/policylens_comments_cleaned_v1.csv`
- **Total Real Comments:** **7,967 open-text responses** across 10 distinct survey questions.
- **Language Distribution:** English: 6,787 (85.2%), French: 1,180 (14.8%).
- **Schema:**
  `comment_id, comment, source_document, source_url, section_page, stakeholder, topic, stance, concern, demand, language, source_question`

### 1.2 Breakdown by Source Question
The open-text fields serve fundamentally different communicative functions:
| Question Code | Focus / Prompt | Comments Count | Mean Chars | Role in PolicyLens |
| :--- | :--- | :---: | :---: | :--- |
| **Q8** | *What other topics/commitments should Canada include in its next Open Government Action Plan?* | **2,195** | 223.1 | **Primary Policy Demand & Reform Agenda** |
| **Q14** | *Why are you satisfied / dissatisfied with Open Government?* | **2,346** | 75.3 | Accountability & Operational Friction |
| **Q18** | *What topic did you provide civic feedback on?* | 849 | 92.6 | Citizen Participation Experience |
| **Q2R_OTHER**| *Other priorities for transparency* | 558 | 93.9 | Transparency Gap Filling |
| **Q4R_OTHER**| *Other priorities for accountability* | 454 | 91.8 | Accountability Gap Filling |
| **Q9R_OTHER**| *Other areas of interest* | 424 | 106.6 | Domain Topics |
| **Q19R_OTHER**| *Other sector representation* | 388 | 30.5 | Short demographic tags |
| **Q6R_OTHER**| *Other participation channels* | 279 | 106.6 | Engagement Channels |
| **Q12R_OTHER**| *Other involvement channels* | 250 | 53.8 | Channel Descriptions |
| **Q11R_OTHER**| *Other involvement activities* | 224 | 84.7 | Activity Descriptions |

### 1.3 Key Limitations & Risks
1. **Uncurated User Text:** Comments range from single sentences to multi-paragraph essays. Many contain colloquialisms, Hinglish/slang, French syntax, or administrative terminology.
2. **Self-Selection & Public Service Over-representation:** 25.5% of respondents identify as Federal Government employees, skewing internal operational concerns (e.g. Phoenix pay system).
3. **Not Pre-structured as Policy Demands:** Citizens rarely write formal "policy statements." Instead, their demands are embedded inside grievances, anecdotes, and expressions of frustration.
4. **Non-transferability of Sentiment Baselines:** An 80% accuracy score on Amazon product reviews (predicting stars from product opinions) provides **no evidence** that a model can extract policy demands or synthesize collective public verdicts.

---

## 2. Label Inspection & Supervised Feasibility

### 2.1 Inspection of Human Annotation Files
- **`data/annotated/policylens_annotation_batch_001.csv`:** Contains 200 real comments with **0 non-null values** for `topic`, `stance`, `concern`, or `demand`. It is a blank annotation batch waiting for human coders.
- **`data/synthetic/policylens_synthetic_100_comments.csv`:** Contains 100 synthetic rows created for schema prototyping (`is_synthetic=True`). These are **not real consultation data** and must not be used as ground truth.
- **`docs/annotation/annotation_guidelines.md`:** Outlines the target taxonomy (11 topics, 3 stances, open text concerns/demands).

### 2.2 Finding on Supervised Readiness
> **Conclusion:** There are **zero human-labelled real examples** currently available.  
> Training a supervised classifier or sequence-to-sequence model for concern/demand extraction at this stage would require fabricating synthetic labels, which strictly violates research rules (`RESEARCH_RULES.md`).  
> **Unsupervised semantic clustering and evidence-based grouping** is the rigorous method for discovering natural policy clusters before human labeling.

---

## 3. Targeted Pilot Annotation Sample

To initiate human annotation without overwhelming coders with 7,967 comments, a stratified 50-comment pilot batch was exported:
- **File:** `experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv`
- **Selection Strategy:** Proportional sampling across the 9 discovered semantic clusters, prioritizing substantive, high-information comments.
- **Fields Requiring Human Coders:**
  1. `topic`: Select one from `OPEN_DATA`, `TRANSPARENCY`, `PARTICIPATION`, `DIGITAL_SERVICES`, `PRIVACY_SECURITY`, `ACCOUNTABILITY`, `TRUST`, `INNOVATION`, `CAPACITY`, `OTHER`, `UNCLEAR`.
  2. `stance`: `SUPPORT`, `OPPOSE`, or `NEUTRAL`.
  3. `concern`: Specific complaint/risk raised (concise text, max 200 chars). Leave blank if none.
  4. `demand`: Actionable policy reform or deliverable requested (concise text, max 200 chars). Leave blank if none.

---

## 4. Semantic Grouping Prototype & Findings

### 4.1 Methodology
- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense semantic vectors, cosine normalized).
- **Target Feedback Corpus:** Question 8 substantive comments (N = 2,161 substantive comments after removing 34 trivial 1-word non-answers like "None").
- **Clustering:** K-Means with silhouette score optimization ($K \in [5, 10]$). Optimal $K=9$ achieved the best balance of thematic granularity and cluster cohesion.
- **Representative Selection:** Measured cosine similarity of all comments to their cluster centroid; selected top 3 central comments as verbatim anchors.

### 4.2 The 9 Policy Issue Clusters & Collective Verdict Table

| Cluster ID | Policy Theme | Comment Count | Share (%) | Top Extracted Keywords | Candidate Concern & Requested Action |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **3** | **National Civic Priorities & Citizen-Centric Governance** | **518** | **23.97%** | *canada, canadians, government, people, need, public* | **Concern:** [UNVERIFIED] Desire for responsive government, reduced bureaucracy, and public services that directly benefit all Canadians.<br>**Action:** [UNVERIFIED] Prioritize high-impact public service delivery benchmarks and measure citizen satisfaction. |
| **0** | **Democratic Reform, Ethical Governance & Political Accountability** | **347** | **16.06%** | *accountability, reform, accountable, open, decisions* | **Concern:** [UNVERIFIED] Citizens perceive a disconnect between public consultation promises and government decisions, driven by corporate lobbying and limited political accountability.<br>**Action:** [UNVERIFIED] Tighten lobbying disclosure regulations, reform electoral and parliamentary transparency rules, and publish clear rationales for government decisions. |
| **6** | **Francophone Civic Priorities & Bilingual Public Administration** | **321** | **14.85%** | *gouvernement, canadiens, santé, éducation, données* | **Concern:** [UNVERIFIED] Les citoyens francophones soulignent des lacunes dans l'accès bilingue équitable aux données gouvernementales et aux services publics ouverts.<br>**Action:** [UNVERIFIED] Assurer la parité bilingue stricte dans la publication des données ouvertes et les mécanismes de consultation civique fédéraux. |
| **1** | **Fiscal Accountability, Public Spending & Procurement Transparency** | **239** | **11.06%** | *spending, tax, government, debt, money, contracts* | **Concern:** [UNVERIFIED] Lack of transparent line-item visibility into federal spending, outsourced vendor contracting, and tax expenditures.<br>**Action:** [UNVERIFIED] Publish comprehensive machine-readable procurement and budgetary disclosures with searchable vendor histories and expenditure audits. |
| **5** | **Social Policy Priorities: Health, Education & Electoral Reform** | **239** | **11.06%** | *health, education, thank, job, proportional, questions* | **Concern:** [UNVERIFIED] Citizen priorities focus heavily on healthcare access, education funding, and democratic representation mechanisms.<br>**Action:** [UNVERIFIED] Expand open data commitments to track inter-governmental health transfers, educational outcomes, and electoral representation data. |
| **2** | **Open Data Usability, Standards & Privacy Protection** | **180** | **8.33%** | *data, information, government, open, access, privacy* | **Concern:** [UNVERIFIED] Open data portals suffer from broken links, outdated datasets, non-standardized proprietary formats, and inadequate privacy safeguards.<br>**Action:** [UNVERIFIED] Enforce mandatory open data standards (APIs, CSV, JSON), systematic data catalog refreshes, and clear citizen privacy-by-design guidelines. |
| **8** | **Indigenous Reconciliation & Data Sovereignty** | **177** | **8.19%** | *indigenous, nations, reconciliation, aboriginal, diversity* | **Concern:** [UNVERIFIED] Open government initiatives fail to reflect Indigenous self-determination, reconciliation commitments, and the data sovereignty of First Nations, Inuit, and Métis.<br>**Action:** [UNVERIFIED] Partner with Indigenous leadership to establish co-governed data frameworks aligned with OCAP principles and TRC Calls to Action. |
| **4** | **Environmental Protection & Climate Action Transparency** | **96** | **4.44%** | *environment, environmental, climate, clean, change* | **Concern:** [UNVERIFIED] Insufficient public disclosure and open monitoring of environmental assessments, carbon emissions, and corporate environmental compliance.<br>**Action:** [UNVERIFIED] Mandate open environmental data publishing, real-time climate monitoring dashboards, and transparent regulatory review processes. |
| **7** | **Public Service Administration & Phoenix Pay System Resolution** | **44** | **2.04%** | *phoenix, fix, pay, public service, servants* | **Concern:** [UNVERIFIED] Federal employees experience ongoing compensation failures, administrative distress, and fear of retaliation related to the Phoenix pay system rollout.<br>**Action:** [UNVERIFIED] Dedicate immediate open government accountability tracking to resolving federal public service payroll systems and protecting whistleblower rights. |

---

## 5. Evidence Audit: Representative Verbatim Citizen Excerpts

All representative comments below are drawn directly from the dataset, citing their verified stable `comment_id`, stakeholder group, and official consultation portal URL:

### Cluster 2: Open Data Usability, Standards & Privacy Protection
- **Comment ID:** `110000109968_Q8`  
  **Stakeholder:** *Business / Milieu des affaires* | **Similarity:** `0.7602`  
  **Source URL:** `https://open.canada.ca/en/content/canadas-action-plan-open-government`  
  > *"Open data should be provided in standard, machine readable formats, with full API access. Too often government data is locked in PDFs or proprietary spreadsheet formats."*

- **Comment ID:** `110000049214_Q8`  
  **Stakeholder:** *Federal Government / Gouvernement fédéral* | **Similarity:** `0.7511`  
  > *"Standardizing data collection and reporting across all departments and agencies. Data needs to be timely and interoperable."*

### Cluster 1: Fiscal Accountability & Procurement Transparency
- **Comment ID:** `110000146950_Q8`  
  **Stakeholder:** *Individual / Particulier* | **Similarity:** `0.7291`  
  > *"Complete transparency on how tax dollars are spent, including contracts awarded to outside consultants and procurement details."*

### Cluster 7: Public Service Administration & Phoenix Pay System Resolution
- **Comment ID:** `110000164893_Q8`  
  **Stakeholder:** *Federal Government / Gouvernement fédéral* | **Similarity:** `0.7490`  
  > *"Fixing the Phoenix pay system. Public servants cannot focus on open government and innovation when they are not being paid correctly or on time."*

### Cluster 8: Indigenous Reconciliation & Data Sovereignty
- **Comment ID:** `110000185934_Q8`  
  **Stakeholder:** *First Nations, Inuit or Métis government or organization* | **Similarity:** `0.7388`  
  > *"Implementing the Truth and Reconciliation Commission Calls to Action, with particular focus on First Nations data governance and mutual respect."*

---

## 6. Verification Status & Human-in-the-Loop Safeguards

1. **Unverified Notice Requirement:** Every auto-generated concern and action in `policylens_issue_summary_table.csv` and `.json` carries the required prefix:
   `[UNVERIFIED - Awaiting Human Review]`.
2. **Zero Fabrication Policy:**
   - No synthetic labels were introduced.
   - All 2,161 comments were preserved verbatim.
   - All source URLs trace to the Government of Canada Open Government portal.
3. **Data Segregation:**
   - Sentiment baseline artifacts in `experiments/sentiment_baseline/` were untouched.
   - Core processed data in `data/processed/` and raw data in `data/raw/` were unchanged.

---

## 7. Test Results & Code Validation

- Added unit tests: [`tests/ml_pipeline/test_semantic_clustering.py`](file:///Users/pankaj/Desktop/Project/major%20project/Code/tests/ml_pipeline/test_semantic_clustering.py).
- Tests assert:
  - Output file existence and schema compliance.
  - Verbatim comment preservation against processed canonical data.
  - Mandatory `[UNVERIFIED]` prefix across all generated concerns and actions.
  - Empty target annotation fields in the pilot batch.
- **Full Test Suite Status:** **89 passed, 4 skipped** across the entire repository.

---

## 8. Next Recommended Steps for PolicyLens

1. **Human Labeling of the 50-Comment Pilot Batch:**
   Annotate `experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv` following `docs/annotation/annotation_guidelines.md`.
2. **Compute Inter-Annotator Agreement (Cohen's / Fleiss' Kappa):**
   Evaluate agreement on `topic` and `stance` across 2 human coders on this 50-comment batch to calibrate the annotation guideline clarity before expanding to the 200-comment batch.
3. **Few-Shot Prompted Concern/Demand Extraction:**
   Using the verified human-annotated examples as in-context exemplars, evaluate small instruction-tuned models for structured concern and demand slot filling.
