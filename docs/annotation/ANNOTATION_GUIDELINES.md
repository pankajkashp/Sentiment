# PolicyLens — Annotation Guidelines
### Version 1.0.0 | DRAFT — Awaiting Research Team Review

---

> **STATUS: DRAFT**
> These guidelines have not yet been validated by inter-annotator agreement studies.
> Do NOT begin large-scale annotation until a pilot study has been completed and
> guidelines revised accordingly.

---

## 1. Purpose

This document defines how human annotators should label individual public consultation
comments from the dataset `ap2016-18_individual_comments.csv`.

These labels are the **ground truth** for training and evaluating all PolicyLens models.

**Critical rule:** Labels in this dataset must reflect your genuine reading of the text.
Do NOT infer labels from external knowledge, assumed speaker identity, or political priors.
Label what is explicitly stated or clearly implied in the text itself.

---

## 2. What You Are Annotating

Each annotation unit is a **single comment**, which may come from one of these source columns:

| Column (semantic name)  | Description                                 | Priority |
|-------------------------|---------------------------------------------|----------|
| `practical_idea`        | One practical idea for open government       | **Primary** |
| `engagement_question`   | Answer to a public engagement question       | **Primary** |
| `og_importance`         | Why open government is important             | **Primary** |
| `improvements`          | Suggested improvements                       | Secondary |
| `other_comments`        | Other free-text comments                    | Secondary |

Each source column of each row is annotated **independently**.
A single participant row may produce multiple annotation units.

---

## 3. Annotation Schema

### 3.1 Required Fields

| Field                  | Type          | Allowed Values | Required |
|------------------------|---------------|----------------|----------|
| `comment_id`           | string        | Unique ID      | ✅ |
| `source_dataset`       | string        | e.g. `ap2016-18` | ✅ |
| `source_row_id`        | string        | From `row_id` column | ✅ |
| `source_column`        | string        | Semantic column name | ✅ |
| `original_text`        | string        | Exact verbatim copy | ✅ |
| `annotator_id`         | string        | Your annotator ID | ✅ |
| `annotation_date`      | ISO 8601 date | e.g. `2026-10-09` | ✅ |
| `topic`                | string        | See §3.2 | ✅ |
| `stance`               | string        | See §3.3 | ✅ |
| `concern`              | string/null   | Free text, max 200 chars | ✅ |
| `demand`               | string/null   | Free text, max 200 chars | ✅ |
| `annotation_confidence`| integer       | 1, 2, or 3 | ✅ |
| `requires_review`      | boolean       | true / false | ✅ |
| `review_notes`         | string/null   | Free text | If requires_review=true |

---

### 3.2 Topic Labels

> ⚠️ **IMPORTANT**: The topic taxonomy below is a **preliminary draft**.
> It was constructed based on initial reading of the dataset.
> It MUST be validated and revised after a pilot annotation round.
> Do NOT treat these as final categories.

**Preliminary topic taxonomy** (subject to revision):

| Code | Label | Description |
|------|-------|-------------|
| `OPEN_DATA` | Open Data | Access to, sharing of, or quality of government data |
| `TRANSPARENCY` | Transparency | Government openness, accountability, disclosure |
| `PARTICIPATION` | Public Participation | Citizen engagement, consultation, co-design |
| `DIGITAL_SERVICES` | Digital Services | Online services, digital tools, e-government |
| `PRIVACY_SECURITY` | Privacy & Security | Data privacy, cybersecurity, personal information |
| `COLLABORATION` | Collaboration | Cross-sector, intergovernmental, public-private partnerships |
| `TRUST` | Trust in Government | Public confidence, credibility |
| `CULTURE_CHANGE` | Culture & Mindset | Government culture, attitude change, leadership |
| `CAPACITY` | Capacity & Skills | Training, literacy, resources |
| `INFORMATION_ACCESS` | Information Access | ATIP, records, proactive disclosure |
| `INNOVATION` | Innovation | New approaches, experimentation, technology adoption |
| `OTHER` | Other | Does not fit any above category |
| `UNCLEAR` | Unclear | Cannot determine topic from text |

**Multi-topic comments:** If a comment clearly addresses two topics equally, record the
most prominent one. If genuinely ambiguous, use `UNCLEAR` and flag for review.

---

### 3.3 Stance Labels

| Value | Meaning |
|-------|---------|
| `SUPPORT` | The comment **supports** or positively endorses an open government idea, action, or principle |
| `OPPOSE` | The comment **opposes**, critiques, or expresses concern about an open government action or policy |
| `NEUTRAL` | The comment is descriptive, informational, or neither clearly supporting nor opposing |

#### Stance Decision Rules

- **SUPPORT**: Look for language like "should", "need more of", "great", "important to", "recommend", actionable demands framed positively.
- **OPPOSE**: Look for negation, criticism, problem identification, "doesn't work", "too slow", "not enough".
- **NEUTRAL**: Descriptive statements, questions without implied stance, purely factual content.

> ⚠️ Note: A demand for improvement is NOT automatically OPPOSE.
> "We should have better data portals" = SUPPORT (for open data).
> "The current consultation process is inadequate" = OPPOSE.

---

### 3.4 Concern Field

- **Definition**: What specific **problem, gap, or risk** does the commenter identify?
- If no concern is stated, write `null`.
- Be concise (max 200 characters). Paraphrase if needed.
- Write in English even if the original text is French.

**Examples:**
- ✅ `"Lack of standardization in open data formats across departments"`
- ✅ `"Public unaware of existing open government initiatives"`
- ❌ `"The commenter doesn't like things"` (too vague)
- ❌ Copying the entire original text verbatim (too long)

---

### 3.5 Demand Field

- **Definition**: What specific **action, change, or outcome** does the commenter request?
- If no demand is stated, write `null`.
- Be concise (max 200 characters). Paraphrase if needed.
- Write in English even if the original text is French.

**Examples:**
- ✅ `"Create a single open data portal with standardized formats"`
- ✅ `"Increase public awareness through targeted outreach campaigns"`
- ❌ `"They want things to be better"` (too vague)

> A comment may have a concern without a demand (pure problem identification) or
> a demand without an explicit concern. Both are valid.

---

### 3.6 Annotation Confidence

| Score | Meaning |
|-------|---------|
| `3` | High — text is clear, unambiguous, confident in all labels |
| `2` | Medium — some ambiguity but reasonable interpretation possible |
| `1` | Low — text is ambiguous, fragmentary, or very short; labels are uncertain |

---

### 3.7 Requires Review Flag

Set `requires_review = true` when:
- Confidence is 1
- The comment is in a language you cannot read
- The comment contains potentially sensitive content (personal information, offensive language)
- The comment has embedded translation annotations (`RT:`) and you are unsure which version to label
- You are genuinely unsure about the correct label

---

## 4. Handling Bilingual and Translated Text

Many comments in this dataset appear in French with embedded English retranslations,
formatted as: `[French text]. RT: [English translation].`

**Rule:**
- Label based on the **original language text** if you can read it.
- If you cannot read the original language, use the `RT:` translation.
- Record which version you used in `review_notes`.
- Do NOT label the `RT:` translation portion as if it were an additional comment.

---

## 5. What NOT to Annotate

Do NOT annotate:
- The `participation_preference_codes` column (numeric codes without codebook)
- The `three_words` column at this stage (supplementary only)
- The `would_recommend` column (this is a numeric score, not a text comment)

---

## 6. Comment ID Convention

Format: `{dataset_id}_{source_row_id}_{column_short_name}`

Examples:
- `ap2016-18_35_practical_idea`
- `ap2016-18_91_og_importance`
- `ap2016-18_NOROWID_1_engagement_question` (for rows with null row_id, use sequential index)

---

## 7. Pilot Annotation Protocol

Before full-scale annotation begins:
1. Select 20–30 comments representing diverse topics, lengths, and languages.
2. Have at least 2 annotators independently label all pilot comments.
3. Calculate inter-annotator agreement (Cohen's kappa for topic and stance).
4. **Target agreement:** κ ≥ 0.70 for stance; κ ≥ 0.60 for topic.
5. Review disagreements, revise guidelines, repeat pilot if needed.
6. Only proceed to full annotation when agreement targets are met.
7. Record all agreement scores in `docs/research/iaa_results.md`.

> ⚠️ This step is MANDATORY before any model training.

---

## 8. Data Leakage Prevention

- Annotators must NOT know which split (train/validation/test) a comment will be assigned to.
- Splits are assigned AFTER annotation is complete.
- Annotators must NOT use other rows' annotations to inform their current annotation.

---

## 9. Sensitive Content

If a comment contains personal information (name, email, organization affiliation used as
personal identifier) or offensive content:
- Set `requires_review = true`
- Note the issue in `review_notes`
- Do NOT redact the text yourself — flag it for a data steward decision.

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2026-10-09 | Initial draft |

---

*Questions or disagreements about these guidelines should be raised with the research lead
before annotating.*
