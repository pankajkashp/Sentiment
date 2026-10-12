# PolicyLens — Research Integrity Rules

**Version 1.0.0 | Effective: 2026-10-09**

These rules are binding on all contributors, code, documentation, and reports.

---

## Absolute Prohibitions

| # | Rule |
|---|------|
| R1 | Do NOT claim that a model achieves any accuracy, F1, or other metric unless the experiment has **actually been run** and results recorded in `results/`. |
| R2 | Do NOT invent, fabricate, or hallucinate annotation labels. All labels must come from human annotation or an explicitly documented weak-labeling experiment. |
| R3 | Do NOT generate synthetic research results and treat them as real. |
| R4 | Do NOT cite papers, datasets, or models that have not been verified to exist. |
| R5 | Do NOT assume a model is "best" before comparative experiments have been run. |
| R6 | Do NOT allow test data to enter training in any form (preprocessing, feature fitting, label leakage). |
| R7 | Do NOT treat AI-generated labels as ground truth. They may be used only as documented auxiliary/weak-labeling. |
| R8 | Do NOT overwrite previous experiment results. Use versioned output directories. |
| R9 | Do NOT make a major architectural or research methodology decision silently. Stop and document the decision and rationale. |
| R10 | Do NOT modify files in `data/raw/`. That directory is immutable. |

---

## Required Practices

| # | Rule |
|---|------|
| P1 | Every experiment must record: dataset version, split, preprocessing version, model, hyperparameters, random seed, training time, metrics, timestamp, result artifact path. |
| P2 | Human-annotated labels are the primary ground truth. |
| P3 | Inter-annotator agreement must be measured and reported before any model is trained on annotations. |
| P4 | All reported metrics must specify exactly which dataset split they were measured on. |
| P5 | Data leakage checks must pass before any model evaluation is considered valid. |
| P6 | All processed datasets must record which version of raw data and preprocessing they were derived from. |

---

## Reporting Template

When reporting any result, always state:

```
Model:              [name + version]
Dataset:            [dataset_id + version]
Split:              [train / validation / test]
Preprocessing:      [version]
Random seed:        [value]
Trained on:         [date]
Metrics:
  Accuracy:         [value] ± [std if applicable]
  Macro-F1:         [value]
  Weighted-F1:      [value]
  Confusion matrix: [see artifact path]
Artifact:           results/[experiment_id]/
```

Any result that does not follow this template is not a valid reported result.
