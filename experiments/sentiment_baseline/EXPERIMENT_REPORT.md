# PolicyLens Experiment: Sentiment Analysis Baseline

**Date:** 2026-10-13  
**Status:** Completed  
**Artifact Directory:** `experiments/sentiment_baseline/`  
**Dataset Replacement:** Migrated from unavailable *Amazon Reviews Multi* dataset to `McAuley-Lab/Amazon-Reviews-2023`.

---

## 1. Dataset Card & Pre-Flight Verification

### 1.1 Dataset Card Analysis
- **Hugging Face Hub ID:** `McAuley-Lab/Amazon-Reviews-2023`
- **Authors:** Julian McAuley Lab (UC San Diego)
- **Paper Reference:** Hou et al., *Bridging Language and Items for Retrieval and Recommendation*, arXiv:2403.03952 (2024).
- **License & Usage:** Academic / Research use only.
- **Available Fields for User Reviews:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `rating` | `float` | Numerical product rating from 1.0 to 5.0 |
  | `title` | `str` | Title of the user review |
  | `text` | `str` | Open-text body of the review (confirmed content field) |
  | `images` | `list` | Image URLs associated with the review |
  | `asin` | `str` | Child product identifier |
  | `parent_asin` | `str` | Parent product identifier |
  | `user_id` | `str` | Unique reviewer identifier |
  | `timestamp` | `int` | Unix millisecond timestamp |
  | `helpful_vote` | `int` | Number of helpful votes received |
  | `verified_purchase` | `bool` | Purchase verification flag |

### 1.2 Loading Method Verification
- **Hugging Face `datasets` Deprecation:** In `datasets>=3.0.0` (including current `5.1.0`), Hugging Face removed execution of custom Python loading scripts (`trust_remote_code=True` and `Amazon-Reviews-2023.py` throw `RuntimeError: Dataset scripts are no longer supported`).
- **Direct Acquisition:** Reviews are stored in the repo under `raw/review_categories/{category}.jsonl`. Direct acquisition via `huggingface_hub.hf_hub_download` (or UCSD mirror) reliably streams and reconstructs the JSONL files without script dependency.

### 1.3 Split Configuration
The raw category subsets provide only a single `"full"` split. Benchmark splits (`0core`/`5core`) in the repository are strictly interaction-based recommendation splits that omit review text. Consequently, reproducible 3-way splits (train/val/test) were constructed directly from the verified raw reviews.

---

## 2. Product Category & Subset Selection

- **Selected Category:** `Subscription_Boxes`
- **Raw File:** `raw/review_categories/Subscription_Boxes.jsonl` (File size: ~8.95 MB)
- **Total Records:** 16,216 reviews
- **Usable Records:** 16,205 reviews (11 empty/whitespace-only reviews dropped)
- **Unique Review Texts:** 15,845 strings (360 duplicate review occurrences identified)

### 2.1 Label Mapping
Numerical ratings were mapped to 3-class sentiment as required:
- **Negative:** `1.0` and `2.0`
- **Neutral:** `3.0`
- **Positive:** `4.0` and `5.0`

**Category Class Breakdown:**
- **Positive:** 10,387 reviews (64.10%)
- **Negative:** 4,067 reviews (25.10%)
- **Neutral:** 1,751 reviews (10.80%)

---

## 3. Data Leakage Prevention & Split Strategy

To prevent identical review texts from leaking across dataset partitions:
1. All reviews were grouped by exact string content (`text`).
2. Stratified train/val/test splitting was executed at the **group (text) level** using the modal sentiment label (`random_state=42`).
3. Split proportions:
   - **Train:** 12,981 reviews (80.11%)
   - **Validation:** 1,618 reviews (9.98%)
   - **Test:** 1,606 reviews (9.91%)
4. **Leakage Verification:** Asserted `len(train_texts ∩ val_texts) == 0`, `len(train_texts ∩ test_texts) == 0`, and `len(val_texts ∩ test_texts) == 0`. Zero duplicates crossed split boundaries.

---

## 4. Models & Feature Extraction

### Feature Extraction
- **Representation:** TF-IDF Vectorizer
- **Parameters:** `ngram_range=(1, 2)`, `max_features=10,000`, `sublinear_tf=True`, `min_df=2`
- Fit strictly on the training set and applied to validation and test sets.

### Architectures
1. **Logistic Regression:**
   - Standard (`class_weight=None`, `max_iter=1000`)
   - Balanced (`class_weight='balanced'`, `max_iter=1000`)
2. **Linear Support Vector Machine (LinearSVC):**
   - Standard (`class_weight=None`, `max_iter=1000`)
   - Balanced (`class_weight='balanced'`, `max_iter=1000`)

---

## 5. Experimental Results (Test Set)

### 5.1 Overall Performance Summary

| Model | Test Accuracy | Macro-F1 | Weighted-F1 | Val Accuracy | Val Macro-F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Linear SVM (Standard)** | **0.7995** | 0.6254 | 0.7829 | 0.8140 | 0.6343 |
| **Logistic Regression (Standard)** | 0.7964 | 0.5827 | 0.7649 | **0.8232** | 0.6230 |
| **Logistic Regression (Balanced)** | 0.7827 | **0.6688** | **0.7936** | 0.8010 | **0.6864** |
| **Linear SVM (Balanced)** | 0.7821 | 0.6354 | 0.7805 | 0.8127 | 0.6669 |

> **Key Observation:** Because the dataset has class imbalance (64.1% Positive, 25.1% Negative, 10.8% Neutral), standard models favor the majority class, achieving slightly higher raw accuracy (~80%) at the expense of Neutral recall. Introducing balanced class weighting substantially boosts minority Neutral detection, lifting **Macro-F1 from 0.5827 to 0.6688** (+8.6% absolute gain) for Logistic Regression.

---

### 5.2 Detailed Per-Class Metrics (Test Set, Support = 1,606)

#### 1. Logistic Regression (Balanced) — *Top Macro-F1*
- **Macro-F1:** `0.6688` | **Accuracy:** `78.27%`
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Negative** | 0.7014 | 0.7345 | 0.7176 | 403 |
| **Neutral** | 0.3444 | 0.4689 | 0.3971 | 177 |
| **Positive** | 0.9311 | 0.8558 | 0.8918 | 1,026 |

**Confusion Matrix:**
```
               Predicted Negative  Predicted Neutral  Predicted Positive
True Negative         296                 72                 35
True Neutral           64                 83                 30
True Positive          62                 86                878
```

---

#### 2. Linear SVM (Standard) — *Top Accuracy*
- **Macro-F1:** `0.6254` | **Accuracy:** `79.95%`
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Negative** | 0.7002 | 0.7419 | 0.7205 | 403 |
| **Neutral** | 0.3908 | 0.1921 | 0.2576 | 177 |
| **Positive** | 0.8709 | 0.9269 | 0.8980 | 1,026 |

**Confusion Matrix:**
```
               Predicted Negative  Predicted Neutral  Predicted Positive
True Negative         299                 34                 70
True Neutral           72                 34                 71
True Positive          56                 19                951
```

---

#### 3. Linear SVM (Balanced)
- **Macro-F1:** `0.6354` | **Accuracy:** `78.21%`
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Negative** | 0.6927 | 0.7270 | 0.7094 | 403 |
| **Neutral** | 0.3210 | 0.2938 | 0.3068 | 177 |
| **Positive** | 0.8923 | 0.8879 | 0.8901 | 1,026 |

**Confusion Matrix:**
```
               Predicted Negative  Predicted Neutral  Predicted Positive
True Negative         293                 54                 56
True Neutral           71                 52                 54
True Positive          59                 56                911
```

---

#### 4. Logistic Regression (Standard)
- **Macro-F1:** `0.5827` | **Accuracy:** `79.64%`
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Negative** | 0.7041 | 0.7320 | 0.7178 | 403 |
| **Neutral** | 0.3846 | 0.0847 | 0.1389 | 177 |
| **Positive** | 0.8441 | 0.9444 | 0.8914 | 1,026 |

**Confusion Matrix:**
```
               Predicted Negative  Predicted Neutral  Predicted Positive
True Negative         295                 15                 93
True Neutral           76                 15                 86
True Positive          48                  9                969
```

---

## 6. Directory Structure & Saved Artifacts

```
experiments/sentiment_baseline/
├── EXPERIMENT_REPORT.md
├── run_baseline.py
├── dataset/
│   ├── metadata.json
│   ├── train.csv                      # 12,981 reviews
│   ├── val.csv                        # 1,618 reviews
│   └── test.csv                       # 1,606 reviews
├── models/
│   ├── tfidf_vectorizer.joblib
│   ├── logistic_regression_standard.joblib
│   ├── logistic_regression_balanced.joblib
│   ├── linear_svm_standard.joblib
│   └── linear_svm_balanced.joblib
├── metrics/
│   ├── evaluation_summary.json
│   ├── classification_report_*.txt
│   └── confusion_matrix_*.csv
└── figures/
    ├── class_distribution.png
    ├── performance_comparison.png
    └── confusion_matrix_*.png
```

---

## 7. Implications for PolicyLens

1. **Subtle Sentiment Sensitivity:** Neutral reviews (rating 3) are challenging for linear models due to mixed lexicons (e.g., *"Product was okay, but shipping took too long"*). In public policy consultations (e.g. PolicyLens Open Government comments), nuanced stances (`constructive_suggestion`, `mixed`) present an analogous challenge, highlighting the need for balanced loss functions or dense semantic representations (RoBERTa / DeBERTa fine-tuning).
2. **Reproducible Baseline Benchmark:** This experiment establishes a lightweight, deterministic baseline against which dense transformer embeddings and PolicyLens consultation-specific sentiment heads can be compared.
