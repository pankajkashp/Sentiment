# PolicyLens — Real Human-Reviewed Model Benchmark & Empirical Evidence Report

**Date:** 2026-10-13  
**System:** PolicyLens NLP Pipeline  
**Module:** `experiments/model_benchmark/`  
**Evaluation Dataset:** `experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv`  
**Dataset Provenance:** `VERIFIED_HUMAN_ANNOTATIONS` (Approved Human-Reviewed Pilot Dataset, $N=50$)  
**Protocol:** Leak-free 5-Fold Repeated Stratified Cross-Validation (2 repeats, 10 total folds)  

---

## 1. Executive Summary & Provenance Verification

Following human researcher confirmation, the approved 50-comment pilot annotation dataset at:
`experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv`
was validated and benchmarked as the **ground-truth human evaluation resource**.

### Dataset Integrity & Validation Audit
* **Total Records:** 50 verbatim public consultation comments from Canada's Open Government Action Plan consultation.
* **Completed Topics:** 50 / 50 (100.0%) across the approved 11-category taxonomy.
* **Completed Stances:** 50 / 50 (100.0%) across `SUPPORT`, `OPPOSE`, `NEUTRAL`, `MIXED`.
* **Concern & Demand Fields:** 48 concerns, 47 demands (3 intentional empty fields where citizens voiced grievances without formulating actionable demands).
* **Annotator Provenance:** Original annotator ID (`AI_assisted_draft_review_required`) preserved intact for audit trail.
* **Validation Outcome:** `VALID_AND_READY` recorded in `data_validation_report.json`.
* **Silent Fallback Enforcement:** Silent synthetic-fixture fallback was explicitly disabled; the benchmark ran exclusively on the verified human data.

---

## 2. Research Questions & Empirical Answers (RQ1 – RQ6)

### RQ1: How accurately can PolicyLens classify the stance of public-policy feedback?
* **Empirical Answer:** PolicyLens achieves **60.0% accuracy** and **0.4432 Macro-F1** ($\kappa = 0.2582$) using a TF-IDF Linear SVM with balanced class weighting. Stance detection on public policy submissions is feasible even with linear baselines, but class balancing is mandatory to prevent collapsing into the dominant class.

### RQ2: Which topic-classification approach best matches human-annotated policy themes?
* **Empirical Answer:** Unsupervised semantic clustering achieves **56.0% cluster purity** ($NMI = 0.3005$, $ARI = 0.0407$) against human taxonomy codes. In contrast, supervised 11-way topic classifiers on $N=50$ achieve only $0.1690$ Macro-F1 due to severe sample sparsity (several classes have $\le 3$ examples). Unsupervised semantic clustering remains the preferred exploratory approach until hundreds of human labels are available.

### RQ3: Can models extract concerns and requested actions without hallucinating demands?
* **Empirical Answer:** **Without safeguarding, standard cluster summarizers suffer a 100.0% hallucination rate on pure grievances.** In the baseline, all 3 comments without demands (e.g., bare topic nouns *"poverty"*, *"senate reform"*, and punctuation *.*) had ungrounded cluster actions hallucinated for them ($0/3$ preserved, $100\%$ hallucination rate).
* **With PolicyLens Demand-Presence Safeguard (`DemandPresenceDetector`):**
  - **Hallucinations eliminated:** **0.0%** hallucination rate (0 unsupported actions generated).
  - **Empty demands preserved:** **3 / 3 (100.0%)** correctly kept empty.
  - **Demand-presence precision:** **100.0%** (all 17 extracted actions were confirmed ground-truth requests).
  - **Abstention on uncertainty:** **22 comments flagged for human review** rather than inventing demands under ambiguous evidence.
  - **Evidence attribution hierarchy:** Enforces strict distinction between `RESPONDENT_EXPLICIT_DEMAND`, `MODEL_INFERRED_RECOMMENDATION`, and `ANALYST_PROPOSED_ACTION`.

### RQ4: How sensitive are model results to algorithms, representations, and class weights?
* **Empirical Answer:** 
  1. **Class Weighting:** Introducing `class_weight='balanced'` produced an **+85% improvement in Macro-F1** (0.4432 vs 0.2389). Unweighted models collapsed into the majority class (`SUPPORT`).
  2. **N-gram Range:** Word unigrams `(1,1)` outperformed bigrams `(1,2)` (Macro-F1 0.4432 vs 0.3715) by reducing feature sparsity on the small sample size.
  3. **Domain Transfer:** Directly applying the Amazon Reviews 2023 commercial sentiment model zero-shot dropped performance to **0.3242 Macro-F1** and 46.0% accuracy ($\kappa = 0.0804$), confirming that consumer product sentiment does not transfer cleanly to policy discourse.

### RQ5: How well do candidate models generalize to Indian policy feedback?
* **Empirical Answer:** Untested empirically on Indian data. The current 50 comments represent Canadian English and French public consultation submissions. Cross-lingual transfer to Indian English, Hindi, and Hinglish remains an open research priority once Indian regulatory datasets (e.g., TRAI/MyGov) are onboarded.

### RQ6: How can predictions be aggregated into a collective verdict without relying solely on volume?
* **Empirical Answer:** Implemented and validated via `collective_verdict.py`. The multi-dimensional algorithm prioritizes policy issues by balancing:
  $$\text{Composite Score} = 0.40 \times \text{Volume} + 0.35 \times \text{Risk Severity} + 0.25 \times \text{Stakeholder Breadth}$$
  Every finding preserves stable comment IDs and representative verbatim evidence, with automated abstention flags when sample support is low ($N < 5$).

---

## 3. Real Stance Classification Benchmark Leaderboard

Evaluated via **5-Fold Repeated Stratified Cross-Validation (2 repeats, 10 total folds, $N=50$ human-reviewed comments)**:

| Model | Representation | Hyperparameters | Mean Accuracy (± Std) | Mean Macro-F1 (± Std) | Cohen's $\kappa$ | Protocol | Provenance |
|---|---|---|---|---|---|---|---|
| **Linear SVM** | `tfidf_word_1_1_sublinear` | $C=10.0$, balanced | **0.6000 (± 0.1342)** | **0.4432 (± 0.1342)** | **0.2582** | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Logistic Regression** | `tfidf_word_1_1_sublinear` | $C=10.0$, balanced | 0.6000 (± 0.1265) | 0.4285 (± 0.1049) | 0.2490 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Logistic Regression** | `tfidf_word_1_1_sublinear` | $C=1.0$, balanced | 0.5900 (± 0.1375) | 0.4168 (± 0.1070) | 0.2309 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Linear SVM** | `tfidf_word_1_2_sublinear` | $C=10.0$, balanced | 0.5700 (± 0.1269) | 0.3715 (± 0.1441) | 0.1733 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Linear SVM** | `tfidf_word_1_1_sublinear` | $C=1.0$, balanced | 0.5600 (± 0.1356) | 0.3629 (± 0.1200) | 0.1370 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Amazon 2023 Transferred LR** | Pre-trained vocab | Frozen commercial sentiment | 0.4600 (± 0.0000) | 0.3242 (± 0.0000) | 0.0804 | Zero-Shot Cross-Domain | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Majority Baseline** | None | Dominant class (`SUPPORT`) | 0.5600 (± 0.0490) | 0.2389 (± 0.0136) | 0.0000 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Logistic Regression** | `tfidf_word_1_1_sublinear` | $C=1.0$, unweighted | 0.5600 (± 0.0490) | 0.2389 (± 0.0136) | 0.0000 | 5-Fold Repeated Stratified CV | `VERIFIED_HUMAN_ANNOTATIONS` |

### Detailed Per-Class Breakdown (Best Model: LinearSVC balanced, Pooled Out-of-Fold Predictions):
* **`SUPPORT` ($N=56$ pooled fold evaluations across 2 repeats):**
  * Precision: **0.6620** | Recall: **0.8393** | F1: **0.7402**
* **`OPPOSE` ($N=26$ pooled fold evaluations):**
  * Precision: **0.7143** | Recall: **0.3846** | F1: **0.5000**
* **`NEUTRAL` ($N=18$ pooled fold evaluations):**
  * Precision: **0.2000** | Recall: **0.1667** | F1: **0.1818**

---

## 4. Real Topic Classification & Alignment Results

| Approach | Metric | Measured Value | Standard Deviation / Protocol | Provenance |
|---|---|---|---|---|
| **Unsupervised Clustering vs Human Taxonomy** | Cluster Purity | **0.5600** | $K=8$ clusters vs 7 human topics | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Unsupervised Clustering vs Human Taxonomy** | Adjusted Rand Index (ARI) | **0.0407** | Permutation-adjusted overlap | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Unsupervised Clustering vs Human Taxonomy** | Normalized Mutual Info (NMI) | **0.3005** | Shared information entropy | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Supervised Logistic Regression** | Macro-F1 | 0.1690 | 5-Fold Repeated K-Fold (N=50) | `VERIFIED_HUMAN_ANNOTATIONS` |
| **Supervised Linear SVM** | Macro-F1 | 0.1245 | 5-Fold Repeated K-Fold (N=50) | `VERIFIED_HUMAN_ANNOTATIONS` |

---

## 5. Concern & Demand Extraction Evaluation

Evaluated against the approved human ground truth:

| Metric | Measured Value | Denominator & Evaluated Inputs | Scientific Finding |
|---|---|---|---|
| **Empty-Demand Agreement Rate** | **0.0%** | 0 / 3 true blank demands matched | Baseline cluster summarizer generated demands for 100% of rows. |
| **Unsupported / Hallucinated Demand Rate** | **100.0%** | 3 / 3 true blank demands received actions | Fabricated actions on all comments that formulated pure concerns. |
| **Mean Demand Token F1** | 0.0514 | 47 non-empty demand comparisons | Extracted actions differ lexically from abstract cluster templates. |
| **Mean Demand Token Jaccard** | 0.0272 | 47 non-empty demand comparisons | Lexical overlap is low; semantic matching needed. |
| **Mean Concern Token F1** | 0.0591 | 48 non-empty concern comparisons | Extracted concerns differ from cluster summary templates. |
| **Evidence Traceability** | **100.0%** | 50 / 50 comments | Every prediction links to a persistent `comment_id`. |

---

## 6. Real Qualitative Error Analysis

Inspection of `error_analysis.csv` on the approved human ground truth highlights three dominant misclassification patterns:

1. **False Positives on `SUPPORT` (Dominant Class Bias):**
   * *Example (ID: `110000086296_Q8`):* `"senate reform"` (Human: `OPPOSE`, Predicted: `SUPPORT`).
   * *Cause:* High-frequency open government reform vocabulary in the training distribution is predominantly positive/supportive. The model misattributes reform requests to supportive sentiment.
2. **Polarity Inversion on Critical Constructive Feedback:**
   * *Example (ID: `110000098829_Q8`):* `"I am concerned with Government spending and increased taxes. Less government is needed."` (Human: `OPPOSE`, Predicted: `SUPPORT`).
   * *Cause:* Mentions of policy targets without explicit profanity or standard sentiment lexicon fool commercial/n-gram features.
3. **Neutral Tone Confusion:**
   * *Example (ID: `110000089513_Q8`):* `"the government will pick what they want"` (Human: `NEUTRAL`, Predicted: `SUPPORT`).
   * *Cause:* Cynical or matter-of-fact observations lack polarized emotional markers.

---

## 7. Demand-Presence Safeguard & Evidence Attribution Evaluation

To prevent PolicyLens from inventing requested actions on citizen comments expressing grievances without proposing a solution, we implemented and evaluated the **Demand-Presence Safeguard** (`DemandPresenceDetector`) on the approved 50-comment human dataset.

### Baseline vs Safeguarded Extraction Comparison ($N=50$)

| Evaluation Metric | Existing Baseline (Unconditional Cluster Attachment) | Safeguarded Pipeline (`DemandPresenceDetector`) | Improvement / Delta |
|---|---|---|---|
| **Evaluated Comments** | 50 | 50 | — |
| **True Demand Count (Ground Truth)** | 47 (94.0%) | 47 (94.0%) | — |
| **True Empty Demand Count (Ground Truth)** | 3 (6.0%) | 3 (6.0%) | — |
| **Correctly Preserved Empty Demands** | **0 / 3 (0.0%)** | **3 / 3 (100.0%)** | **+100.0% (Clean preservation)** |
| **Unsupported / Hallucinated Actions** | **3 (100.0% error)** | **0 (0.0% error)** | **-100.0% (Eliminated hallucinations)** |
| **Demand Extraction Precision** | 94.0% (47/50) | **100.0% (17/17)** | **+6.0% (Zero false positives)** |
| **Demand Extraction Recall** | 100.0% (47/47) | 36.2% (17/47) | Conservatively abstains under uncertainty |
| **Demand Macro-F1** | 0.9691 | 0.5312 | Balances safety vs recall |
| **Cases Flagged for Human Review** | 0 (Unconditionally guesses) | **22 (44.0%)** | Prevents blind automation |
| **Comments Gated as Concern Only** | 0 | 11 (22.0%) | Cleanly suppresses blank demands |

### Verified Demand Status Distribution
- `EXPLICIT_DEMAND`: 11 comments (Direct imperatives, deontic modals, explicit request verbs).
- `IMPLICIT_DEMAND`: 6 comments (Nominalized policy reform goals, comparative targets).
- `CONCERN_ONLY`: 11 comments (Descriptive past-tense action verbs, operational complaints, pure dissatisfaction).
- `UNCLEAR_OR_INSUFFICIENT`: 22 comments (Fragmentary text, single tokens, or ambiguous intent routed to human review).

### Strict Evidence Attribution Hierarchy
The safeguarded architecture enforces three strictly non-equivalent attribution tiers:
1. `RESPONDENT_EXPLICIT_DEMAND`: Directly stated in the citizen comment verbatim, citing `comment_id` and verbatim excerpt.
2. `MODEL_INFERRED_RECOMMENDATION`: Algorithmic synthesis derived across a topic cluster; explicitly tagged so policy analysts know it is NOT an individual citizen quote.
3. `ANALYST_PROPOSED_ACTION`: Policy reform proposed by domain experts.
* **Guarantee:** Cluster-level actions are never broadcasted as individual citizen demands, and empty demands remain blank.

---

## 8. Traceable Second-Pass Analysis of Flagged Cases ($N=22$) & Calibration Principles

To advance PolicyLens toward safely identifying additional genuine citizen demands without increasing unsupported demand attributions, we conducted a traceable second-pass analysis of the **22 comments flagged as `UNCLEAR_OR_INSUFFICIENT` (`FLAGGED_FOR_HUMAN_REVIEW`)**.

### 1. Second-Pass Review Worksheet & Protocol Deliverables
* **Blank Review Worksheet:** Generated at [human_review_worksheet_flagged_22.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/human_review_worksheet_flagged_22.csv).
  - Strictly preserves annotation integrity: contains exactly 22 flagged comments identified by persistent `comment_id`.
  - Human label column (`human_reviewed_demand_presence_label`) and rationale column (`reviewer_rationale`) are **100% blank**.
  - No model predictions or simulated human labels are auto-filled.
  - Initial `adjudication_status` is set to `PENDING_REVIEW`.
* **Adjudication Protocol & Taxonomy Guide:** Published at [review_protocol_demand_presence.md](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/review_protocol_demand_presence.md).
  - Enforces the 4-label taxonomy: `EXPLICIT_DEMAND`, `IMPLICIT_DEMAND`, `CONCERN_ONLY`, `UNCLEAR_OR_INSUFFICIENT`.
  - Provides objective disambiguation rules for edge cases (distinguishing past-tense descriptive narratives from future demands; distinguishing bare problem nouns from nominalized policy goals).
* **Reproducible Evaluation Script:** Implemented at [evaluate_flagged_review.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/evaluate_flagged_review.py).
  - Automatically verifies whether human labels are populated.
  - When labels are pending, safely reports `PENDING_HUMAN_ADJUDICATION` without failing.
  - Once reviewed, computes precision, recall, F1, separate explicit/implicit metrics, and generates a per-comment error audit.

### 2. Diagnostic Linguistic Audit of the 22 Flagged Cases

Comparing the 22 flagged comments against the approved pilot annotations (`policylens_pilot_annotation_batch_50.csv`) reveals why the safeguard conservatively abstained rather than making automated assumptions:

| Linguistic Sub-Category | Comment Count | Representative Example (`comment_id`) | Linguistic Root Cause |
|---|---|---|---|
| **Passive Deontic Modal** | 4 | `"The public should be involved in debates..."` (`110000094512_Q8`) | Subject is non-standard (*"The public"* or *"It"* rather than *"Government"*); modal pattern did not fire. |
| **Nominalized Reform in Short Inputs** | 3 | `"Poverty reduction/elimination"` (`110000050658_Q8`) | Token count $\le 2$ triggered the short-fragment safeguard before nominalized reform patterns were evaluated. |
| **Comparative Quality Aspiration** | 5 | `"More adequate and speedy ways to assess disabilities..."` (`110000076498_Q8`) | Used comparative modifier (*"more adequate and speedy"*) with non-standard noun (*"ways"* instead of *"access/speed"*). |
| **Philosophical Civic Goal** | 4 | `"Role of aspiring immigrants in shaping transparent government."` (`110000292931_Q8`) | Formulated as a high-level aspiration without operational imperatives or modal verbs. |
| **French Diacritic / Negative Syntax** | 3 | `"les casiers judiciaires ne devraient pas empêcher..."` (`110000086983_Q8`) | Negative French deontic modal (*"ne devraient pas"*) or unaccented *"a l'écoute"*. |
| **Descriptive Problem Mention** | 2 | `"Various support services for Canadians while travelling abroad"` (`110000106722_Q8`) | Mentions service domain; lacks clear directive or grievance indicator. |
| **Punctuation Fragment** | 1 | `"."` (`110000059156_Q8`) | True empty demand: correctly preserved as empty without hallucination. |

### 3. Strict Separation of Development Findings from Independent Validation
* **Methodological Boundary:** To avoid data leakage and prevent tuning rules directly against a final test set, the patterns observed in the 22 flagged comments are treated strictly as **development observations**.
* **Rule Calibration Proposals (Candidate Extensions for Independent Validation):**
  1. *Passive Modal Generalization:* Adding `\b(?:should|must|needs?\s+to)\s+be\s+(?:involved|disclosed|included|published|provided|made|ensured)\b`.
  2. *Short-Input Priority Ordering:* Evaluating nominalized reform patterns (`reduction`, `elimination`, `reform`) before evaluating the 2-token fragmentary length cutoff.
  3. *French Diacritic & Negative Tolerance:* Supporting `(?:ne\s+)?(?:doit|doivent|devrait|devraient)\s+(?:pas\s+)?` and unaccented `a l'écoute`.
* **Validation Requirement:** These proposed extensions must be independently validated on a future unseen batch ($N=200$) before being claimed as production generalization improvements.

---

## 9. Class Imbalance, Overfitting Risks & Threats to Validity

1. **Class Imbalance in Stance:**
   * `SUPPORT` comprises 56% (28/50), `OPPOSE` comprises 26% (13/50), and `NEUTRAL` comprises 18% (9/50).
   * Models trained without class weighting predict `SUPPORT` for almost every input, achieving 56% accuracy but failing completely on minority dissent.
2. **Severe Sparsity in Topic Taxonomy:**
   * `OTHER`: 23 samples (46%)
   * `TRANSPARENCY`: 8 samples
   * `PARTICIPATION`: 7 samples
   * `ACCOUNTABILITY`: 6 samples
   * `DIGITAL_SERVICES`: 3 samples
   * `UNCLEAR`: 2 samples
   * `OPEN_DATA`: 1 sample
   * *Risk:* 11-way supervised classifiers cannot generalize reliably when categories have 1–3 samples.
3. **Sample Size Limitations ($N=50$):**
   * While 5-fold cross-validation with 2 repeats provides reliable out-of-fold estimates, a 50-example sample size is insufficient for deep transformer fine-tuning.
4. **Language & Domain Boundary:**
   * The dataset covers Canadian federal open government submissions. Cross-lingual performance on Indian policy consultations (RQ5) remains an unvalidated research hypothesis.

---

## 10. Exact Artifact & Evidence Paths

| Artifact | Path |
|---|---|
| **Blank Human-Review Worksheet ($N=22$)** | [human_review_worksheet_flagged_22.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/human_review_worksheet_flagged_22.csv) |
| **Review Protocol & Label Definitions** | [review_protocol_demand_presence.md](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/review_protocol_demand_presence.md) |
| **Reproducible Flagged Evaluation Script** | [evaluate_flagged_review.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/evaluate_flagged_review.py) |
| **Flagged Evaluation Diagnostic JSON** | [flagged_review_evaluation.json](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/flagged_review_evaluation.json) |
| **Demand-Presence Detector** | [demand_detector.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/demand_detector.py) |
| **Safeguard Evaluation Engine** | [evaluate_demand_safeguard.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/evaluate_demand_safeguard.py) |
| **Safeguard Metrics JSON** | [demand_safeguard_evaluation.json](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/demand_safeguard_evaluation.json) |
| **Safeguard Per-Sample Comparison** | [demand_safeguard_comparison.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/demand_safeguard_comparison.csv) |
| **Safeguard Regression Tests** | [test_demand_safeguard.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/tests/ml_pipeline/test_demand_safeguard.py) |
| **Validation Report** | [data_validation_report.json](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/data_validation_report.json) |
| **Model Comparison Leaderboard** | [model_comparison.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/model_comparison.csv) |
| **Cross-Validation Records (Folds)** | [cross_validation_results.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/cross_validation_results.csv) |
| **Error Analysis Table** | [error_analysis.csv](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/error_analysis.csv) |
| **Results Payload** | [results.json](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/results.json) |
| **Append-Only Experiment Log** | [experiment_log.jsonl](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/experiment_log.jsonl) |
| **Confusion Matrix Figure** | [figures/stance_confusion_matrix.png](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/figures/stance_confusion_matrix.png) |
| **Macro-F1 Comparison Chart** | [figures/model_comparison_f1.png](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/figures/model_comparison_f1.png) |
| **Collective Verdict Aggregator** | [collective_verdict.py](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/collective_verdict.py) |
| **Collective Verdict JSON** | [collective_verdict.json](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/collective_verdict.json) |
| **Collective Verdict Briefing** | [collective_verdict_briefing.md](file:///Users/pankaj/Desktop/Project/major%20project/Code/experiments/model_benchmark/collective_verdict_briefing.md) |

---

## 11. Unresolved Limitations & Scope Boundaries

1. **Evaluated Sample Size ($N=50$):**
   * While 0 hallucinations were observed on the 3 true-negative comments in the 50-comment pilot batch, **zero hallucinations cannot be guaranteed beyond this evaluated sample**. Real-world public consultations with hundreds of thousands of comments will inevitably exhibit linguistic edge cases that require ongoing monitoring.
2. **Conservative Abstention / Review Rate (44.0%):**
   * The current safeguard routes 22 out of 50 comments to human review (`FLAGGED_FOR_HUMAN_REVIEW`) to prevent blind false-positive demand attributions. While safe, this high human review rate necessitates human triage capacity before high-throughput ingestion.
3. **Absence of Calibrated Probabilistic Confidence Scores:**
   * Current detector confidence scores (0.60, 0.85, 0.92, 0.95) are deterministic rule-based heuristic assignments, not calibrated posterior probabilities. True probabilistic calibration requires thousands of annotated examples.
4. **Single-Annotator Pilot Provenance:**
   * Ground truth currently reflects single-reviewer consensus. Multi-annotator inter-rater reliability (Cohen's / Fleiss' $\kappa$) will be computed upon completion of independent second-pass coding.
5. **Cross-Lingual Domain Boundary:**
   * Language validation is restricted to Canadian English and French. Cross-lingual generalization to Indian regulatory discourse (Indian English, Hindi, Hinglish) remains an open empirical question.

---

## 12. Next Recommended Steps for PolicyLens

1. **Conduct Second-Pass Human Adjudication:** Have independent policy analysts populate `human_review_worksheet_flagged_22.csv` following the guidelines in `review_protocol_demand_presence.md`.
2. **Execute Independent Validation ($N=200$):** Test the proposed linguistic extensions (passive modals, diacritic tolerance) on an unseen 200-comment expansion batch to measure generalization without test-set leakage.
3. **Integrate Triage Queue in API:** Connect the `FLAGGED_FOR_HUMAN_REVIEW` signal to the PolicyLens backend review queue for interactive human-in-the-loop verification.
4. **Onboard Indian Regulatory Feedback:** Test cross-lingual domain adaptation on public submissions from TRAI / MyGov consultations.
