# PolicyLens — Concise Annotation Guide

**Target Worksheet:** `experiments/semantic_clustering/dataset/human_annotation_worksheet_50.csv`  
**Purpose:** Provide ground-truth human labels for topic classification, stance detection, concern extraction, and demand extraction.

---

## 1. Field Definitions & Coding Standards

| Column | Coding Options | Instructions |
|---|---|---|
| `comment_id` | Read-only | Unique stable ID. Do not modify. |
| `comment` | Read-only | Verbatim citizen comment. Do not modify. |
| **`topic`** | 11 Taxonomy Codes | Select exactly one primary code (see Section 2). |
| **`stance`** | `SUPPORT`, `OPPOSE`, `NEUTRAL`, `MIXED` | Evaluative position toward open government / policy (see Section 3). |
| **`concern`** | Short Text (Max 200 chars) | Specific problem, barrier, or risk raised. **Leave blank if none stated.** |
| **`demand`** | Short Text (Max 200 chars) | Concrete reform, deliverable, or policy action requested. **Leave blank if none stated.** |

---

## 2. Topic Taxonomy (Select Exactly One)

1. `OPEN_DATA`: Portals, formats (CSV/JSON/API), machine-readability, catalog usability, metadata standards.
2. `TRANSPARENCY`: Proactive disclosure, government spending, contracts, ministerial meetings, lobbying.
3. `PARTICIPATION`: Citizen consultations, co-creation, town halls, democratic engagement, feedback loops.
4. `DIGITAL_SERVICES`: Online government services, website usability, IT systems, digital modernization.
5. `PRIVACY_SECURITY`: Protecting citizen data, personal privacy, surveillance concerns, CRA data protections.
6. `ACCOUNTABILITY`: Ministerial oversight, ethics enforcement, audit mechanisms, tracking government promises.
7. `TRUST`: Public confidence in institutions, integrity, reducing political cynicism.
8. `INNOVATION`: Open-source software, eliminating vendor lock-in, emerging technologies in government.
9. `CAPACITY`: Literacy, digital skills, training for public servants or citizens in data reuse.
10. `OTHER`: Domain policy issues outside open government administration (e.g. healthcare delivery, environment, tax policy).
11. `UNCLEAR`: Fragmentary, incoherent, or impossible to interpret with confidence.

---

## 3. Stance Coding Rules

- **`SUPPORT`**: Commenter affirms, praises, or encourages open government principles, transparency initiatives, or public collaboration.
- **`OPPOSE`**: Commenter criticizes, expresses skepticism, or condemns government transparency, secrecy, or administrative failure.
- **`NEUTRAL`**: Purely descriptive, factual, or balanced comments without an evident evaluative tone (e.g. describing an academic study or occupation).
- **`MIXED`**: Expresses both substantial praise and substantial critique within the same comment.

---

## 4. Special Rules & Edge Cases with Real Examples

### Edge Case 1: Unclear or Incoherent Comments
- **Rule:** If a comment is fragmentary, typographical nonsense, or lacks semantic clarity, code:
  - `topic` = `UNCLEAR`
  - `stance` = `NEUTRAL`
  - `concern` = `""` (leave blank)
  - `demand` = `""` (leave blank)
- **Example:** *"idk really nothing to say just test"* or *"need more stuff"*.

### Edge Case 2: Mixed Stances (Praise Combined with Criticism)
- **Rule:** When a citizen endorses open government in principle but sharply condemns current implementation, code `stance` as `MIXED`.
- **Example:** *"Open government is essential for democracy and I applaud the initiative, but the open data portal search engine is broken and impossible to navigate."*
  - `topic`: `OPEN_DATA`
  - `stance`: `MIXED`
  - `concern`: *"Open data portal search engine is broken and difficult to navigate"*
  - `demand`: *"Improve open data portal search and discovery functionality"*

### Edge Case 3: Comments with a Concern but No Specific Demand
- **Rule:** Citizens frequently express frustrations without proposing a solution. **Never invent or assume a demand.** Extract the concern and leave `demand` strictly blank.
- **Example:** *"I filed an ATIP request eight months ago and still haven't received a single response or update."*
  - `topic`: `TRANSPARENCY`
  - `stance`: `OPPOSE`
  - `concern`: *"Severe delays and lack of communication in processing ATIP requests"*
  - `demand`: `""` *(Leave strictly blank — do NOT invent 'speed up ATIP requests')*

### Edge Case 4: Comments with a Demand but No Explicit Complaint
- **Rule:** Citizens often request a specific policy action directly without lodging a grievance. Extract the demand and leave `concern` strictly blank.
- **Example:** *"Please make all federal geospatial data available via standardized WMS and GeoJSON APIs."*
  - `topic`: `OPEN_DATA`
  - `stance`: `SUPPORT`
  - `concern`: `""` *(Leave strictly blank)*
  - `demand`: *"Provide federal geospatial data through standardized WMS and GeoJSON APIs"*

### Edge Case 5: Bilingual / French Comments
- **Rule:** Do not translate French text. Read and code using the same taxonomy and summarize concerns/demands in French or English verbatim.
- **Example:** *"Le gouvernement doit obliger les ministères à publier leurs contrats d'impartition en format ouvert."*
  - `topic`: `TRANSPARENCY`
  - `stance`: `SUPPORT`
  - `concern`: *"Manque de divulgation obligatoire des contrats d'impartition ministériels"*
  - `demand`: *"Obliger la publication de tous les contrats d'impartition en format ouvert"*

---

## 5. Review Checklist Before Submission
- [ ] No `concern` or `demand` text exceeds 200 characters.
- [ ] Blank fields are genuinely empty (not filled with 'N/A' or 'None').
- [ ] Original comment text was not edited or corrected for spelling.
- [ ] `annotator_id` is recorded for tracking.
