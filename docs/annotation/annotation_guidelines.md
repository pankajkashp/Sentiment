# PolicyLens — Human Annotation Guidelines
**Version:** 1.1.0  
**Target File:** `data/annotated/policylens_annotation_batch_001.csv`  
**Research Integrity:** Strictly comply with `docs/research/RESEARCH_RULES.md` (no hallucinated labels).

---

## 1. Objective

Human annotations provide the **primary ground truth** for training and evaluating PolicyLens ML models:
1. **Topic Classification:** Identifying the primary subject of citizen feedback.
2. **Stance Detection:** Detecting whether the commenter supports, opposes, or remains neutral toward open government initiatives.
3. **Concern Extraction:** Summarizing the specific problem, risk, or barrier identified.
4. **Demand Extraction:** Summarizing the actionable change, request, or policy outcome proposed.

---

## 2. File Schema & Fields to Label

| Column | Status | Action Required |
|---|---|---|
| `comment_id` | Read-only | Unique identifier (e.g., `110000194613_Q8`). Do not modify. |
| `comment` | Read-only | Verbatim text of citizen input. Do not modify. |
| `source_document` | Read-only | Source document name. |
| `source_url` | Read-only | Public portal link. |
| `section_page` | Read-only | Survey question code (`Q8`, `Q14`, `Q18`, etc.). |
| `stakeholder` | Read-only | Stakeholder self-identification (e.g., `Federal Government`, `Academia`). |
| `language` | Read-only | Comment language (`en` or `fr`). |
| `source_question`| Read-only | The prompt the citizen was responding to. |
| **`topic`** | **LABEL** | Select exactly one primary code from Section 3. |
| **`stance`** | **LABEL** | Select one of: `SUPPORT`, `OPPOSE`, `NEUTRAL`. |
| **`concern`** | **LABEL** | Concise problem description (max 200 chars). Leave blank if none stated. |
| **`demand`** | **LABEL** | Concise action/demand description (max 200 chars). Leave blank if none stated. |

---

## 3. Topic Taxonomy

Choose the single most prominent topic:

| Code | Name | Definition & Examples |
|---|---|---|
| `OPEN_DATA` | Open Data & Access | Portal usability, API access, machine-readable datasets, data quality. |
| `TRANSPARENCY` | Transparency & Disclosure | Proactive disclosure, government spending visibility, conflict of interest, lobbying records. |
| `PARTICIPATION` | Public Participation | Citizen consultation, town halls, co-creation, collaborative policymaking. |
| `DIGITAL_SERVICES`| Digital Government | Online service delivery, government website usability, digital modernization. |
| `PRIVACY_SECURITY`| Privacy & Data Protection | Protecting citizen personal information, data security, CRA data privacy. |
| `ACCOUNTABILITY` | Government Accountability | Ministerial responsibility, audit mechanisms, tracking government commitments. |
| `TRUST` | Trust & Integrity | Public confidence in democratic institutions, fighting corruption. |
| `INNOVATION` | Innovation & Open Source | AI in policy, open-source software, eliminating vendor lock-in. |
| `CAPACITY` | Literacy & Skills | Digital literacy, training public servants and citizens in open data. |
| `OTHER` | Other Domain Issue | Policy topics outside open government (e.g., healthcare, immigration, tax reform). |
| `UNCLEAR` | Unclear / Incoherent | Fragmentary text, typo-ridden, or ambiguous intent. |

---

## 4. Stance Guidelines

- `SUPPORT`: The commenter affirms, encourages, or endorses open government initiatives or values (e.g., *"Open data can motivate citizen participation"*).
- `OPPOSE`: The commenter criticizes, expresses skepticism, or opposes government practices (e.g., *"The government continues to pick and choose what materials are shared"*).
- `NEUTRAL`: Purely descriptive, factual, or balanced comments without an evident evaluative stance (e.g., *"I am an urban planner with 10 years experience"*).

---

## 5. Concern & Demand Guidelines

- **Concern:** What problem, bottleneck, or risk does the commenter raise?
  - Example: `"Lack of proactive disclosure for third-party contractor contracts"`
- **Demand:** What specific action, policy, or reform does the commenter demand?
  - Example: `"Publish all federal datasets in standardized CSV and JSON formats"`
- *Note:* If a comment only identifies a problem without an action, leave `demand` blank. If it only makes a proposal without an explicit complaint, leave `concern` blank.
