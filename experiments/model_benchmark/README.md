# PolicyLens — Reproducible Model Benchmarking Package

This directory (`experiments/model_benchmark/`) contains the complete evaluation suite, leak-free benchmarking pipelines, validation tools, and empirical evidence package for PolicyLens.

---

## 1. Directory Structure & Artifacts

| File / Folder | Purpose |
|---|---|
| `validate_annotations.py` | Data integrity validator checking worksheet completion, taxonomy validity, and empty vs missing demands. |
| `data_validation_report.json` | Machine-readable audit of human annotation progress, missing labels, and text preservation. |
| `run_benchmark.py` | Reproducible benchmark runner executing leak-free Repeated Stratified K-Fold CV across models and grids. |
| `benchmark_config.json` | Exact hyperparameters, seeds (`[42, 123, 456]`), CV splits (`5 folds, 2 repeats`), and TF-IDF configurations. |
| `model_comparison.csv` | Cross-model leaderboard comparing Accuracy, Macro-F1, Cohen's Kappa, and standard deviations. |
| `cross_validation_results.csv` | Granular fold-level evaluation records across all 10 folds for every model. |
| `error_analysis.csv` | Granular error diagnoses across false polarity, label ambiguity, and polarity inversion with verbatim text. |
| `results.json` | Aggregated metrics, per-class breakdowns, and confusion matrices. |
| `experiment_log.jsonl` | Append-only execution history recording experiment IDs, timestamps, and parameters. |
| `collective_verdict.py` | Multi-dimensional aggregation engine combining volume, risk severity, and breadth with verbatim evidence. |
| `collective_verdict.json` | Machine-readable collective verdict synthesizing 2,161 comments with stable citations. |
| `collective_verdict_briefing.md` | Executive policy briefing report detailing priority findings and uncertainty warnings. |
| `evaluation_report.md` | In-depth engineering evaluation report detailing methodology, metrics, and limitations. |
| `paper_results_draft.md` | Research paper-ready draft section answering RQ1 through RQ6. |
| `figures/` | Publication-ready visual artifacts (confusion matrices, Macro-F1 comparison charts). |

---

## 2. Reproduction Instructions

### Step 1: Validate Annotation Worksheet Integrity
```bash
python experiments/model_benchmark/validate_annotations.py
```
Outputs validation report to `experiments/model_benchmark/data_validation_report.json`.

### Step 2: Execute Leak-Free Model Benchmarking
```bash
python experiments/model_benchmark/run_benchmark.py
```
This executes:
- 5-Fold Repeated Stratified Cross-Validation on Stance (`MajorityBaseline`, `LogisticRegression`, `LinearSVC`, sentiment transferred baseline).
- Topic Classification (Supervised vs Unsupervised clustering mapping).
- Concern & Demand Extraction (blank demand agreement, token F1/Jaccard, hallucination rate).
- Generates all CSV leaderboards, error analysis, and figures in `figures/`.

### Step 3: Synthesize Policy Collective Verdict
```bash
python experiments/model_benchmark/collective_verdict.py
```
Synthesizes all 2,161 comments from the Canadian Open Government consultation into an evidence-backed collective verdict with persistent comment citations.

---

## 3. Data Leakage Prevention Guarantees
- **Train-Only Feature Fitting:** The TF-IDF vectorizer and all feature scalers are strictly fitted on the training split of each cross-validation fold; validation splits are transformed without refitting.
- **Deduplication Check:** Comments are pre-audited for duplicates to ensure identical text never leaks across train and validation folds.
- **Stratified Partitioning:** Class proportions are preserved across folds using `RepeatedStratifiedKFold`.
- **Text Preservation:** Original citizen comments are strictly read-only and preserved verbatim.
