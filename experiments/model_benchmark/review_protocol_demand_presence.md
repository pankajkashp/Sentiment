# PolicyLens — Review Protocol & Taxonomy for Demand-Presence Adjudication

**Date:** 2026-10-13  
**Module:** `experiments/model_benchmark/`  
**Target Resource:** `human_review_worksheet_flagged_22.csv` ($N=22$ Flagged Comments)  
**Governing Standard:** Traceable, Evidence-Backed Collective Verdict Safeguard

---

## 1. Purpose & Guiding Principles

The objective of this review protocol is to provide objective, reproducible decision criteria for adjudicating the 22 citizen consultation comments flagged as `UNCLEAR_OR_INSUFFICIENT` (`FLAGGED_FOR_HUMAN_REVIEW`) by the PolicyLens Demand-Presence Safeguard.

### Guiding Safeguard Axiom
> **"Never invent a citizen demand from a grievance."**  
> If a citizen describes an operational failure, expresses dissatisfaction, or mentions an issue area without requesting an institutional action, PolicyLens must strictly preserve an empty demand (`""`).

---

## 2. Taxonomy of Demand-Presence Labels

Reviewers must assign exactly **one** of the following four labels in the column `human_reviewed_demand_presence_label`:

### 1. `EXPLICIT_DEMAND`
* **Definition:** The respondent directly and explicitly calls for a specific action, policy change, administrative procedure, or institutional behavior.
* **Linguistic Markers:**
  * Imperative verb at clause head: *"Fix Phoenix"*, *"Publish open datasets"*, *"Revoir la politique..."*
  * Deontic modals addressing government or institutions: *"The government must..."*, *"Public service should..."*, *"They ought to..."*, *"We need to..."*
  * Polite or formal request markers: *"Please provide..."*, *"Veuillez assurer..."*, *"I would like to see decisions made based on..."*
* **Example:**
  > *"the recruitment process for public service should be more transparent i.e publish number of candidates selected to which post in each recruitment drive"* (`110000075068_Q8`)  
  > $\to$ **`EXPLICIT_DEMAND`**

### 2. `IMPLICIT_DEMAND`
* **Definition:** The respondent expresses a clear, actionable desired reform direction or institutional goal, but formulates it nominally, comparatively, or indirectly rather than as a grammatical command.
* **Linguistic Markers:**
  * Nominalized policy goals: *"Poverty reduction/elimination"*, *"Fiscal responsibility"*, *"Direct democracy"*
  * Comparative desired states: *"More adequate and speedy ways to assess disabilities"*, *"Greater transparency in hiring"*
  * Stated aspiration for government posture: *"A government responsive to Canada's cultural diversity"*
* **Example:**
  > *"More adequate and speedy ways to assess disabilities and other benefit eligibility"* (`110000076498_Q8`)  
  > $\to$ **`IMPLICIT_DEMAND`**

### 3. `CONCERN_ONLY`
* **Definition:** The respondent expresses dissatisfaction, criticism, grief, anger, skepticism, or factual description of an operational experience, but does **not** specify or request a solution or reform action.
* **Linguistic Markers:**
  * Past-tense action verbs describing past events: *"I filed an ATIP request and got nothing"*, *"Call centre agents only answered one-third of calls"*
  * Bare topic nouns without directional action: *"poverty"*, *"senate reform"*, *"health care"*
  * Cynical or fatalistic observations: *"the government will pick what they want anyway"*, *"spending and taxes"*
* **Example:**
  > *"Call centre agents only answered the phone about one-third of the time when citizens called."*  
  > $\to$ **`CONCERN_ONLY`** (Descriptive past-tense grievance; no policy solution proposed).

### 4. `UNCLEAR_OR_INSUFFICIENT`
* **Definition:** The submission lacks sufficient semantic or linguistic evidence to determine whether a concern or demand exists.
* **Linguistic Markers:**
  * Pure punctuation: `"."`, `"?"`, `"-"`
  * Non-informative tokens: `"n/a"`, `"none"`, `"idk"`, `"test"`
  * Fragmentary clauses with unrecognizable intent.
* **Example:**
  > `"."` (`110000059156_Q8`)  
  > $\to$ **`UNCLEAR_OR_INSUFFICIENT`**

---

## 3. Disambiguation Rules for Edge Cases

| Scenario | Decision Rule | Correct Label |
|---|---|---|
| **Action verb in past-tense narrative** (*"I applied for EI and was rejected"*) | Past actions are descriptive evidence of a grievance, NOT a policy demand. | `CONCERN_ONLY` |
| **Bare issue noun** (*"Poverty"*, *"Senate"*) | Merely naming a problem area without an actionable verb or nominalized reform goal is an unelaborated topic concern. | `CONCERN_ONLY` |
| **Nominalized reform goal** (*"Poverty reduction/elimination"*) | Contains an explicit directional action (*reduction/elimination*). | `IMPLICIT_DEMAND` |
| **Deontic modal with non-standard subject** (*"The public should be involved"*, *"It should disclose salaries"*) | Deontic *"should"* signals institutional expectation. | `EXPLICIT_DEMAND` |
| **Philosophical aspiration** (*"role of aspiring immigrants in shaping transparent government"*) | Clear civic inclusion objective, formulated without imperatives. | `IMPLICIT_DEMAND` |
| **Single punctuation token** (*"."*) | Insufficient content to interpret. | `UNCLEAR_OR_INSUFFICIENT` |

---

## 4. Annotation Integrity & Provenance Rules

1. **Immutable Ground Truth:** The master file `experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv` must **never** be overwritten or silently modified during this review.
2. **Worksheet Fields:** Reviewers must record decisions in `human_review_worksheet_flagged_22.csv`:
   - `human_reviewed_demand_presence_label`: One of `[EXPLICIT_DEMAND, IMPLICIT_DEMAND, CONCERN_ONLY, UNCLEAR_OR_INSUFFICIENT]`.
   - `reviewer_rationale`: Brief sentence explaining the textual basis.
   - `adjudication_status`: Changed from `PENDING_REVIEW` to `REVIEWED`.
3. **Traceability:** All comment references must use immutable `comment_id` strings (e.g. `110000094512_Q8`), never volatile row numbers.
