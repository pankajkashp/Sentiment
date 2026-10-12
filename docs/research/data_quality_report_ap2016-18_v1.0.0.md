# Data Quality Report: `ap2016-18` v1.0.0

**Generated:** 2026-10-09T04:59:48.455904+00:00
**Rows:** 160  |  **Columns:** 19
**Full duplicate rows:** 13
**Rows with no text content:** 16
**DataFrame hash (SHA-256):** `f67c2a923fa9d47c969adc4a9a271fab3fd746752875714f176d5ce920238457`

## ⚠️ Global Warnings
- 13 fully duplicate rows detected. Deduplication strategy must be decided before annotation split.
- 16 rows have no content in any text column.

## Column-Level Quality
| Column | DType | Null % | Unique | Min Len | Max Len | Avg Len | Warnings |
|--------|-------|--------|--------|---------|---------|---------|----------|
| `row_id` | float64 | 8.8% | 146 | — | — | — | OK |
| `event_name_en` | object | 8.8% | 7 | 9 | 15 | 11.8 | OK |
| `event_name_fr` | object | 8.8% | 7 | 9 | 15 | 11.8 | OK |
| `source_type_en` | object | 8.8% | 1 | 12 | 12 | 12.0 | OK |
| `source_type_fr` | object | 8.8% | 1 | 22 | 22 | 22.0 | OK |
| `source_language` | object | 8.8% | 3 | 1 | 7 | 6.9 | OK |
| `source_language_fr` | object | 8.8% | 2 | 7 | 8 | 7.0 | OK |
| `stakeholder_sector_en` | object | 11.2% | 9 | 5 | 10 | 6.5 | OK |
| `stakeholder_sector_fr` | object | 12.5% | 10 | 4 | 28 | 17.9 | OK |
| `engagement_question` | object | 30.0% | 112 | 15 | 185 | 75.9 | MEDIUM missingness: 30.0% |
| `practical_idea` | object | 21.9% | 125 | 10 | 283 | 87.6 | OK |
| `three_words` | object | 26.9% | 117 | 5 | 154 | 34.5 | MEDIUM missingness: 26.9% |
| `og_importance` | object | 23.1% | 123 | 8 | 324 | 78.7 | OK |
| `participation_preference_codes` | object | 30.6% | 64 | 1 | 84 | 7.5 | MEDIUM missingness: 30.6% |
| `liked_most` | object | 29.4% | 113 | 7 | 147 | 36.3 | MEDIUM missingness: 29.4% |
| `disliked` | object | 62.5% | 59 | 3 | 171 | 45.9 | HIGH missingness: 62.5% |
| `improvements` | object | 47.5% | 84 | 6 | 624 | 71.7 | MEDIUM missingness: 47.5% |
| `recommendation_score` | float64 | 33.1% | 6 | — | — | — | MEDIUM missingness: 33.1% |
| `other_comments` | object | 80.0% | 32 | 7 | 364 | 82.2 | HIGH missingness: 80.0% |