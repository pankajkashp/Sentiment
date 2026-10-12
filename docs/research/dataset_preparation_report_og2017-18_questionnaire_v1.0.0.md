# PolicyLens Research Report: Dataset Preparation — `og2017-18_questionnaire` v1.0.0

**Generated:** 2026-10-12T08:42:19.974322+00:00
**Source Raw File:** `data/raw/Open Government Consultation Data 2017-18 Get Involved Questionnaire.csv`
**Raw File SHA-256:** `bebcc9e5264fc00788c4094b579f90dcf2f8590aaeab528f30a338a7e2344239`
**Curated Output:** `data/processed/og2017_18_questionnaire_curated_v1.0.0.csv`
**Comments Subset:** `data/processed/og2017_18_questionnaire_comments_v1.0.0.csv`

---

## 1. Executive Summary

This report documents the ingestion, inspection, privacy audit, and curation of Canada's **Open Government Consultation Data 2017-18 Get Involved Questionnaire** dataset for the PolicyLens project. The dataset captures nationwide citizen and stakeholder input collected in 2017–2018 to support the co-creation of Canada's 4th National Action Plan on Open Government.

- **Total Survey Records (Rows):** 8,212
- **Total Raw Columns:** 98 columns (parsed from bilingual multi-row headers)
- **Retained Curated Columns:** 24 semantic fields (plus language provenance and audit flags)
- **Removed Columns:** 74 columns (8 empty prompt titles, 1 administrative newsletter flag, 65 closed-ended multi-choice checkbox indicators)
- **Open-Text Fields Retained:** 10 of 10 (100% of open-text fields preserved; 0 discarded)
- **Respondents Providing Open Text:** 4,118 (50.15%)
- **Respondents Providing Closed Ratings/Checkboxes Only:** 4,094 (49.85%)
- **Duplicate Rows / Duplicate IDs:** 0 (all 8,212 respondent records are unique)
- **Privacy Actions:** Redacted postal codes and foreign address PINs from free-text city metadata; preserved Government of Canada pre-publication redaction markers.

---

## 2. Ingestion & Multi-Row Header Parsing

### 2.1 File Characteristics & Encoding
- **File format:** Comma-Separated Values (CSV)
- **File size:** 3,048,593 bytes (~2.91 MB)
- **Encoding:** `Windows-1252` (contains accented French characters, e.g., 'é', 'à', 'œ', '’').
- **Header Structure:** Multi-row bilingual header:
  - **Row 0:** French question headers (`Identifiant unique`, `La langue`, `Date de début`, ...)
  - **Row 1:** English question headers (`Unique Identifier`, `Language`, `Start Date`, ...)
  - **Rows 2 to 8,213:** Exactly 8,212 respondent records, each containing 98 fields.

### 2.2 Loader Configuration
The `CSVIngestionService` and `ColumnMap` were updated with configurable `header_row=1` support, enabling seamless loading of English headers while mapping raw French counterparts (`raw_name_fr`) for bilingual traceability, with 100% backward compatibility for single-header datasets like `ap2016-18`.

---

## 3. Column Inventory & Selection Rationale

### 3.1 Retained Columns (24 Curated Semantic Fields)

| Semantic Name | Role | Non-Null | Null % | Description / Rationale |
|---|---|---|---|---|
| `respondent_id` | id | 8,212 | 0.0% | Unique respondent identifier (12-digit integer). 8212 unique values. 0 nulls. |
| `language` | metadata | 8,212 | 0.0% | Survey interface language: English / Anglais (6803) or French / français (1409). |
| `start_date` | timestamp | 8,212 | 0.0% | Timestamp when questionnaire was started. |
| `end_date` | timestamp | 8,212 | 0.0% | Timestamp when questionnaire was completed. |
| `q1_transparency_important` | numeric | 8,211 | 0.0% | Q1: Is transparency important? 1=Yes (7880), 2=No (331), 1 null. |
| `text_q2r_other_transparency` | text | 558 | 93.2% | Q2 free-text other: Citizens specifying additional transparency priorities (558 comments). |
| `q3_accountability_important` | numeric | 8,211 | 0.0% | Q3: Is accountability important? 1=Yes (8019), 2=No (192), 1 null. |
| `text_q4r_other_accountability` | text | 454 | 94.5% | Q4 free-text other: Citizens specifying additional accountability needs (454 comments). |
| `q5_participation_important` | numeric | 8,211 | 0.0% | Q5: Is citizen participation important? 1=Yes (7380), 2=No (831), 1 null. |
| `text_q6r_other_participation` | text | 279 | 96.6% | Q6 free-text other: Citizens specifying additional participation modalities (279 comments). |
| `text_q8_missed_topics` | text | 2,196 | 73.3% | Q8 free-text: Important aspects of open government driving citizen interest / missed issues. Primary NLP target (2196 comments). **[PRIMARY NLP]** |
| `text_q9r_other_interest` | text | 424 | 94.8% | Q9 free-text other: Citizens specifying unique interests/motivations (424 comments). |
| `q10_more_involvement` | numeric | 8,211 | 0.0% | Q10: Would like more involvement in 4th Plan? 1=Yes (5406), 2=No (2805), 1 null. |
| `text_q11r_other_involvement_activity` | text | 224 | 97.3% | Q11 free-text other: Citizens specifying other ways to contribute (224 comments). |
| `text_q12r_other_involvement_channel` | text | 250 | 97.0% | Q12 free-text other: Citizens specifying other engagement channels (250 comments). |
| `satisfaction_score` | numeric | 8,211 | 0.0% | Q13: Satisfaction score with Open.Canada.ca services (1=Very satisfied to 5=Very dissatisfied, 6=Not applicable/Never used). 1 null. |
| `text_q14_satisfaction_reason` | text | 2,346 | 71.4% | Q14 free-text: Reason for satisfaction/dissatisfaction score. Primary NLP target (2346 comments). **[PRIMARY NLP]** |
| `country` | metadata | 8,106 | 1.3% | Q15: Country of residence (8107 non-null). Canada (7837) + International. |
| `province` | metadata | 8,181 | 0.4% | Q16: Canadian province or territory (8181 non-null). |
| `city` | metadata | 7,623 | 7.2% | Q17: Closest city or town (7625 non-null). Privacy-sanitized in curated dataset. |
| `text_q18_experience_topic` | text | 849 | 89.7% | Q18 free-text: Open government topics/experience willing to share. Primary NLP target (849 comments). **[PRIMARY NLP]** |
| `stakeholder_sector` | metadata | 8,212 | 0.0% | Q19: Stakeholder sector/group (8212 non-null). 13 distinct bilingual categories. |
| `text_q19r_other_sector` | text | 388 | 95.3% | Q19 free-text other: Description for self-identified other sector (388 comments). |
| `on_behalf_of_org` | metadata | 8,101 | 1.4% | Q20: Answering on behalf of organization? 1=Yes (175), 2=No (7666), 3=Other (260), 111 null. |

### 3.2 Audit Flags (Derived Non-Hallucinated Fields)
- `source_language_raw`: Original bilingual language string as received (`English / \nAnglais` or `French / français`).
- `has_open_text`: Boolean indicator (`True` if the respondent provided text in ANY of the 10 open-text fields).
- `open_text_field_count`: Integer count (0 to 10) of non-empty open-text fields filled by the respondent.
- `primary_text_char_count`: Sum of characters across the 3 primary open-text questions (`text_q8_missed_topics`, `text_q14_satisfaction_reason`, `text_q18_experience_topic`).

### 3.3 Potentially Useful Text Fields — Documented Preservation (10/10 Retained)

In strict compliance with **Requirement 5**, **no potentially useful text field was discarded**:

1. `text_q8_missed_topics` (Q8, Col 50): 2,196 responses (mean length 223 chars, max 5,904 chars). Core citizen opinions, policy concerns, and priorities. **Retained as Primary NLP Target.**
2. `text_q14_satisfaction_reason` (Q14, Col 89): 2,346 responses (mean length 75 chars, max 1,131 chars). Critical qualitative evaluations of Canada's open data portals. **Retained as Primary NLP Target.**
3. `text_q18_experience_topic` (Q18, Col 93): 849 responses (mean length 93 chars, max 1,759 chars). Professional and community open government domain expertise. **Retained as Primary NLP Target.**
4. `text_q2r_other_transparency` (Q2R Other, Col 14): 558 responses. Specific transparency topics not captured in the 8 checkboxes. **Retained.**
5. `text_q4r_other_accountability` (Q4R Other, Col 22): 454 responses. Accountability mechanisms suggested by citizens. **Retained.**
6. `text_q6r_other_participation` (Q6R Other, Col 32): 279 responses. Innovative participation channels suggested. **Retained.**
7. `text_q9r_other_interest` (Q9R Other, Col 65): 424 responses. Unique citizen motivations for engaging with open government. **Retained.**
8. `text_q11r_other_involvement_activity` (Q11R Other, Col 73): 224 responses. Concrete activities citizens offered to volunteer for. **Retained.**
9. `text_q12r_other_involvement_channel` (Q12R Other, Col 87): 250 responses. Alternative engagement platforms suggested. **Retained.**
10. `text_q19r_other_sector` (Q19R Other, Col 95): 388 responses. Nuanced stakeholder self-identifications. **Retained.**

### 3.4 Excluded Columns (74 Columns) & Justification

The 74 excluded columns fall into three well-defined categories:

1. **Completely Empty Question Title Headers (8 columns, 100% missing):**
   - `q2_transparency_topics_prompt` (Col 5)
   - `q4_accountability_needs_prompt` (Col 16)
   - `q6_participation_ways_prompt` (Col 24)
   - `q7_strategic_outcomes_prompt` (Col 33)
   - `q9_interest_reasons_prompt` (Col 51)
   - `q9r_prefer_not_to_answer` (Col 64: 0 non-empty entries)
   - `q11_involvement_types_prompt` (Col 67)
   - `q12_involvement_channels_prompt` (Col 74)
   *Rationale:* These columns contain no respondent data whatsoever; they were generated by the survey export tool as group headers.

2. **Administrative Newsletter Distribution Consent (1 column):**
   - `administrative_newsletter_consent` (Col 97: Q21 consent to receive email updates).
   *Rationale:* This is an administrative mailing list consent flag. Email addresses themselves were stripped prior to public release. The flag has no public policy content.

3. **Closed-Ended Multiple-Choice Checkbox Indicators (65 columns):**
   - Q2R Options 1–8 (8 cols): Transparency topic checkboxes
   - Q4R Options 1–5 (5 cols): Accountability need checkboxes
   - Q6R Options 1–7 (7 cols): Participation modality checkboxes
   - Q7R Options 1–16 (16 cols): Strategic priority outcome checkboxes
   - Q9R Options 1–12 (12 cols): Interest reason checkboxes
   - Q11R Options 1–5 (5 cols): Involvement activity checkboxes
   - Q12R Options 1–12 (12 cols): Engagement channel checkboxes
   *Rationale:* These 65 columns represent sparse one-hot checkboxes for predetermined multiple-choice questions. They do not contain citizen open text. In PolicyLens (which focuses on NLP extraction from free text), retaining all 65 checkboxes in the primary curated dataset creates extreme dimensionality without text signal. Note that all open text entered under the corresponding 'Other' options for every one of these questions is fully retained in the curated dataset.

---

## 4. Cleaning, Missing Values, and Privacy Safeguards

### 4.1 Missing Values Handling
- **Zero Imputation:** In adherence to **Rule R2** and **Requirement 6**, no missing values were imputed or hallucinated. Missing values remain represented as `NaN` / empty fields.
- **Whitespace Normalization:** Leading and trailing whitespace was stripped across all text and metadata columns. Empty strings and whitespace-only responses (13 cases) were cleanly converted to nulls.

### 4.2 Duplicate Detection
- **Unique Respondent IDs:** 8,212 unique IDs; 0 duplicate IDs detected.
- **Full Row Duplicates:** 0 duplicate rows across all 98 columns, and 0 duplicate rows across the 24 retained columns.
- **Text Repetitions:** Minor repetitions in text columns consist entirely of natural short responses ('No', 'None', 'Je ne connais pas ce site'). No automated spam or injection detected.

### 4.3 Privacy & PII Protection
- **Government of Canada Pre-Publication Redactions:** The original raw data contains established redaction tokens (`*****Personal Information Removed*****` and `*** L’information personnelle a été supprimée***`), which have been preserved intact.
- **Free-Text Location Postal Code Sanitization:** Inspection revealed that 1 Canadian respondent provided a postal code (`H9W 1Y2` in row 4050) and 3 international respondents provided postal/PIN codes in address text in the `city` column. To prevent precise geographic re-identification, all exact postal/PIN codes in `city` were sanitized to `[REDACTED_POSTAL_CODE]`.

---

## 5. Dataset Statistics & Distributions

- **Curated Dataset Dimensions:** 8,212 rows × 28 columns
- **Comments Subset Dimensions:** 4,118 rows × 28 columns

### 5.1 Language Distribution
- **English (`en`):** 6,803 (82.85%)
- **French (`fr`):** 1,409 (17.15%)

### 5.2 Stakeholder Sector Breakdown (`stakeholder_sector`)
- Federal Government / Gouvernement fédéral: 2,092 (25.47%)
- Individual / Particulier: 1,579 (19.23%)
- Business / Milieu des affaires: 1,169 (14.24%)
- Retired / À la retraite: 612 (7.45%)
- No Answer / Pas de réponse: 505 (6.15%)
- Community or Non-profit / Service communautaire: 476 (5.80%)
- Student / Étudiant (e): 422 (5.14%)
- Academia / Milieu universitaire: 412 (5.02%)
- Other / Autre: 392 (4.77%)
- Provincial/Territorial Government: 228 (2.78%)
- First Nations, Inuit or Métis government or org: 124 (1.51%)
- Municipal Government: 121 (1.47%)
- Media / Médias: 80 (0.97%)

### 5.3 Core Attitudes
- **Transparency Important (Q1):** 7,880 Yes (96.0%), 331 No (4.0%), 1 missing
- **Accountability Important (Q3):** 8,019 Yes (97.7%), 192 No (2.3%), 1 missing
- **Participation Important (Q5):** 7,380 Yes (89.9%), 831 No (10.1%), 1 missing
- **Desire More Involvement (Q10):** 5,406 Yes (65.8%), 2,805 No (34.2%), 1 missing

---

## 6. Known Limitations & Research Cautions

1. **Self-Selection Consultation Bias:** Responses represent self-selected citizens and public servants with high initial interest in government transparency (96% affirmed transparency is important). Findings cannot be generalized to the broader public without weighting.
2. **Over-Representation of Federal Public Servants:** 25.5% of respondents identified as federal government employees, potentially biasing portal satisfaction scores and demand structures.
3. **Missing Codebook for Closed Question Codes:** While the closed question items have descriptive text in the headers, numeric codes in the raw data lack an official external codebook reference in the release.
4. **Satisfaction Scale Direction:** Q13 uses 1=Very satisfied to 5=Very dissatisfied, with 6=Not applicable / never used. Analysts must handle code 6 as categorical 'N/A' rather than a continuous score.

---

## 7. Dataset Isolation & Separation Notice (Requirement 10)

This dataset (`og2017-18_questionnaire`) is maintained **strictly separate** from the existing `ap2016-18` dataset:
- Saved to dedicated files: `data/processed/og2017_18_questionnaire_curated_v1.0.0.csv` and `data/processed/og2017_18_questionnaire_comments_v1.0.0.csv`.
- Distinct ColumnMap registration under `og2017-18_questionnaire`.
- **NO merging, pooled training splits, or cross-dataset concatenation has been performed.**
- Compatibility, question alignment, and respondent overlap will be evaluated in a separate Phase 2 task before any multi-dataset synthesis.