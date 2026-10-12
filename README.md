# PolicyLens

**Collective Public Opinion and Demand Intelligence from Public Consultation Comments**

> ⚠️ **Research project — Phase 1 only.** No models trained. No results claimed.
> See [RESEARCH_RULES.md](docs/research/RESEARCH_RULES.md) for the full research integrity policy.

---

## What Is PolicyLens?

PolicyLens is a research-grade, modular system that converts large volumes of public consultation
comments into structured policy intelligence:

- Topic classification
- Stance detection (Support / Oppose / Neutral)
- Concern / problem extraction
- Demand / action extraction
- Semantic similarity between demands
- Collective demand statistics
- Stakeholder diversity analysis
- Evidence-linked policy insights
- Confidence scoring and human-review flags

**Core research question:** *"What are stakeholders collectively trying to say?"*

---

## Current Phase: Phase 1 — Data Foundation

**Status:** ✅ Complete

| Task | Status |
|------|--------|
| Folder architecture | ✅ |
| CSV schema inspection | ✅ |
| Data quality report | ✅ |
| Column mapping layer | ✅ |
| Annotation template | ✅ |
| Annotation guidelines | ✅ (Draft) |
| Dataset version metadata | ✅ |
| Ingestion unit tests | ✅ 44 passing |
| Data leakage test stubs | ✅ (active after splits) |

**Not yet started (future phases):**
- Annotation / labelling
- Preprocessing pipeline
- Model training / evaluation
- Frontend / API
- Authentication

---

## Project Architecture

```
policylens/
├── data/
│   ├── raw/                   # IMMUTABLE source data — never modify
│   ├── interim/               # Intermediate processing outputs
│   ├── processed/             # Final processed datasets (train/val/test)
│   ├── annotated/             # Human annotation files
│   ├── synthetic/             # Synthetic data (experiments only, never in real eval)
│   └── external/              # External datasets (codebooks, gazetteers, etc.)
│
├── backend/
│   ├── api/v1/                # FastAPI routes (thin — no business logic)
│   ├── application/           # Use cases and application services
│   ├── domain/                # Contracts, entities, value objects
│   ├── providers/             # Pluggable ML/model providers
│   │   ├── stance_classifier/ # StanceClassifier implementations
│   │   ├── topic_classifier/  # TopicClassifier implementations
│   │   ├── demand_extractor/  # DemandExtractor implementations
│   │   ├── embedding/         # EmbeddingProvider implementations
│   │   ├── clustering/        # ClusteringProvider implementations
│   │   ├── summarizer/        # Summarizer implementations
│   │   └── insight_generator/ # InsightGenerator implementations
│   ├── infrastructure/
│   │   ├── ingestion/         # CSV loading, column mapping, data quality
│   │   ├── preprocessing/     # Text cleaning, normalization
│   │   ├── persistence/       # Repository implementations
│   │   ├── security/          # Auth stubs, input validation
│   │   └── logging/           # Structured logging
│   └── config/                # Configuration loading
│
├── ml/
│   ├── models/                # Trained model artefacts (versioned)
│   ├── embeddings/            # Pre-computed embeddings
│   ├── evaluation/            # Evaluation scripts and metrics
│   └── preprocessing/         # ML-specific preprocessing
│
├── experiments/               # Experiment run configs and logs
├── results/                   # Experiment results (versioned, never overwritten)
├── models/                    # Saved model checkpoints
│
├── frontend/                  # Next.js frontend (Phase N)
│
├── tests/
│   ├── unit/                  # Pure unit tests (no I/O)
│   ├── integration/           # Service integration tests
│   ├── api/                   # API contract tests
│   ├── ml_pipeline/           # ML pipeline tests
│   └── data_validation/       # Data integrity and leakage tests
│
├── scripts/                   # Utility scripts (reporting, inspection)
└── docs/
    ├── architecture/          # Architecture decision records
    ├── research/              # Data quality reports, IAA results
    ├── annotation/            # Guidelines and schema
    └── api/                   # API documentation
```

---

## Data Flow

```
Raw Dataset (CSV)
    ↓
Ingestion (CSVIngestionService)
    ↓
Column Mapping (ColumnMap)
    ↓
Validation (DataQualityReporter)
    ↓
Normalization / Preprocessing      ← Phase 2
    ↓
Human Annotation                   ← Phase 2
    ↓
Train / Val / Test Split           ← Phase 2
    ↓
Model Experiments                  ← Phase 3+
    ↓
Demand Extraction
    ↓
Embeddings + Clustering
    ↓
Aggregation + Policy Insights
    ↓
Frontend / API                     ← Phase N
```

---

## Provider Architecture

The application depends on **interfaces**, not implementations.
Switching a model never touches business logic.

```python
# Interface (domain contract)
class StanceClassifier(Protocol):
    def predict(self, text: str) -> StancePrediction: ...

# Implementations (providers)
class TFIDFLogisticRegressionClassifier: ...
class TFIDFSVMClassifier: ...
class GloVeCNNClassifier: ...
class TransformerClassifier: ...

# Configuration-driven selection
MODEL_PROVIDER=logistic_regression  # in .env
```

---

## Dataset

**`ap2016-18_individual_comments.csv`**

| Property | Value |
|----------|-------|
| Source | Government of Canada Open Government engagement events 2016–2018 |
| Rows | 160 |
| Columns | 19 (bilingual EN/FR) |
| Encoding | Windows-1252 |
| Full duplicate rows | 13 |
| Primary text columns | `practical_idea`, `engagement_question`, `og_importance` |
| Known issues | 1 anomalous `source_language` value (`'S'`), participation codebook missing |

Full schema: [`data/raw/metadata_ap2016-18.json`](data/raw/metadata_ap2016-18.json)
Data quality report: [`docs/research/data_quality_report_ap2016-18_v1.0.0.md`](docs/research/data_quality_report_ap2016-18_v1.0.0.md)

---

## Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run all current tests
pytest tests/unit/ tests/data_validation/ -v

# Run with coverage
pytest tests/ --cov=backend --cov-report=term-missing
```

**Current test results:** 44 passed, 4 skipped (leakage tests — activate after splits)

---

## Generating the Data Quality Report

```bash
python scripts/generate_data_quality_report.py
```

Outputs:
- `docs/research/data_quality_report_ap2016-18_v1.0.0.md`
- `docs/research/data_quality_report_ap2016-18_v1.0.0.json`

---

## Research Integrity

This is a research project. The following are **prohibited**:

- Claiming model accuracy before an experiment has run
- Inventing labels or synthetic research results
- Treating AI-generated labels as ground truth
- Allowing test data into training
- Silently making architectural decisions that affect methodology

See full rules: [`docs/research/RESEARCH_RULES.md`](docs/research/RESEARCH_RULES.md)

---

## Open Questions (Requiring Research Decisions)

| # | Question | Priority |
|---|----------|----------|
| 1 | **Participation codebook** — Column 13 contains numeric participation preference codes (`1,2,3,4,5,6`) referencing an external codebook not included with the dataset. Cannot interpret without it. | High |
| 2 | **Deduplication strategy** — 13 fully duplicate rows exist. Remove before annotation? Remove from training only? Document and keep? | High |
| 3 | **Bilingual handling** — Many comments are in French (some with embedded RT: English retranslations). Annotate in original language only? Translate first? Use multilingual models? | High |
| 4 | **Annotation target columns** — Which columns to annotate first? (Recommended: `practical_idea` and `og_importance` as highest-signal demand columns.) | Medium |
| 5 | **Topic taxonomy validation** — Preliminary 13-category taxonomy created. Needs pilot annotation + IAA before finalizing. | Medium |
| 6 | **Acquisition provenance** — Date and method of CSV acquisition not recorded. | Low |

---

## Next Recommended Step

**Phase 2: Annotation Preparation**

1. Resolve open questions above (especially #1, #2, #3)
2. Obtain participation codebook for column 13
3. Run pilot annotation with 20–30 comments (2+ annotators)
4. Measure inter-annotator agreement (target κ ≥ 0.70 stance, κ ≥ 0.60 topic)
5. Revise annotation guidelines based on pilot
6. Build annotation validator (checks against `annotation_schema.json`)
7. Begin full annotation

---

## License

Source code: MIT (see LICENSE)

Dataset license: Open Government Licence – Canada — verify before any public use or publication.
