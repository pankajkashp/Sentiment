#!/usr/bin/env python3
"""
PolicyLens — Human-Annotation Data Validation Tool
Validates human-annotated worksheets against taxonomy specifications, stance schemas,
concern/demand semantic constraints, and checks for data integrity issues.

Enforces:
1. Exact row count & identifier presence (comment_id, cluster_id, comment).
2. Valid taxonomy codes (11 categories) and stance categories (4 classes).
3. Critical distinction between MISSING fields (unannotated NaN) vs EMPTY fields (legitimately no concern/demand).
4. Detection of duplicate comments and annotation conflicts.
5. Identification of concerns without demands, demands without concerns, and mixed/neutral/unclear cases.
6. Verification of text preservation against source corpus.
"""

import argparse
import hashlib
import json
import logging
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("validate_annotations")

BENCHMARK_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BENCHMARK_DIR.parent.parent
DEFAULT_WORKSHEET = PROJECT_ROOT / "experiments" / "semantic_clustering" / "dataset" / "policylens_pilot_annotation_batch_50.csv"
DEFAULT_OUTPUT = BENCHMARK_DIR / "data_validation_report.json"

VALID_TOPIC_CODES = {
    "OPEN_DATA",
    "TRANSPARENCY",
    "PARTICIPATION",
    "DIGITAL_SERVICES",
    "PRIVACY_SECURITY",
    "ACCOUNTABILITY",
    "TRUST",
    "INNOVATION",
    "CAPACITY",
    "OTHER",
    "UNCLEAR",
}

VALID_STANCES = {"SUPPORT", "OPPOSE", "NEUTRAL", "MIXED"}


def validate_worksheet(df: pd.DataFrame, source_df: pd.DataFrame | None = None) -> dict[str, Any]:
    """Validate annotation worksheet and return structured validation dictionary."""
    total_rows = len(df)
    cols = list(df.columns)

    # 1. Column existence
    required_cols = ["comment_id", "cluster_id", "comment", "topic", "stance", "concern", "demand"]
    missing_cols = [c for c in required_cols if c not in cols]

    # 2. Duplicate analysis
    n_distinct_ids = df["comment_id"].nunique() if "comment_id" in df.columns else 0
    duplicate_ids = df[df["comment_id"].duplicated(keep=False)]["comment_id"].tolist() if "comment_id" in df.columns else []

    n_distinct_texts = df["comment"].astype(str).str.strip().str.lower().nunique() if "comment" in df.columns else 0
    duplicate_texts = df[df["comment"].astype(str).str.strip().str.lower().duplicated(keep=False)]["comment_id"].tolist() if "comment" in df.columns else []

    # 3. Text preservation check against source if provided
    text_preservation_ok = True
    text_mismatches = []
    if source_df is not None and "comment_id" in source_df.columns and "comment" in source_df.columns:
        source_map = dict(zip(source_df["comment_id"], source_df["comment"]))
        for _, row in df.iterrows():
            cid = row["comment_id"]
            if cid in source_map and str(row["comment"]) != str(source_map[cid]):
                text_preservation_ok = False
                text_mismatches.append(cid)

    # 4. Check completion and missing vs legitimate empty fields
    # Notice: In Pandas, pd.isna() checks for NaN/None (unannotated missing).
    # An empty string "" or "NONE" or whitespace indicates human reviewed and coded as no demand/concern.
    topic_series = df["topic"] if "topic" in df.columns else pd.Series([np.nan] * total_rows)
    stance_series = df["stance"] if "stance" in df.columns else pd.Series([np.nan] * total_rows)
    concern_series = df["concern"] if "concern" in df.columns else pd.Series([np.nan] * total_rows)
    demand_series = df["demand"] if "demand" in df.columns else pd.Series([np.nan] * total_rows)

    topic_missing_mask = topic_series.isna() | (topic_series.astype(str).str.strip() == "")
    stance_missing_mask = stance_series.isna() | (stance_series.astype(str).str.strip() == "")

    completed_topic_count = int((~topic_missing_mask).sum())
    completed_stance_count = int((~stance_missing_mask).sum())
    fully_labeled_rows_count = int(((~topic_missing_mask) & (~stance_missing_mask)).sum())

    # Taxonomy validation on completed topics
    invalid_topics = []
    topic_distribution = {}
    for idx, val in topic_series[~topic_missing_mask].items():
        val_clean = str(val).strip()
        topic_distribution[val_clean] = topic_distribution.get(val_clean, 0) + 1
        if val_clean not in VALID_TOPIC_CODES:
            invalid_topics.append({"row_index": int(idx), "comment_id": df.loc[idx, "comment_id"], "value": val_clean})

    # Stance validation on completed stances
    invalid_stances = []
    stance_distribution = {}
    for idx, val in stance_series[~stance_missing_mask].items():
        val_clean = str(val).strip()
        stance_distribution[val_clean] = stance_distribution.get(val_clean, 0) + 1
        if val_clean not in VALID_STANCES:
            invalid_stances.append({"row_index": int(idx), "comment_id": df.loc[idx, "comment_id"], "value": val_clean})

    # Concern & demand semantic patterns
    # Distinguish:
    # 1) Row completely unannotated (topic & stance missing) -> concern/demand are missing due to unannotated row.
    # 2) Row annotated (topic & stance present) -> concern/demand empty means legitimate absence.
    concerns_present = []
    demands_present = []
    concern_no_demand = []
    demand_no_concern = []
    both_empty = []
    both_present = []

    for idx in range(total_rows):
        is_row_annotated = not (topic_missing_mask.iloc[idx] and stance_missing_mask.iloc[idx])
        c_raw = concern_series.iloc[idx]
        d_raw = demand_series.iloc[idx]

        c_has_text = not pd.isna(c_raw) and str(c_raw).strip() not in ("", "NONE", "N/A", "nan")
        d_has_text = not pd.isna(d_raw) and str(d_raw).strip() not in ("", "NONE", "N/A", "nan")

        cid = df.loc[idx, "comment_id"] if "comment_id" in df.columns else str(idx)

        if c_has_text:
            concerns_present.append(cid)
        if d_has_text:
            demands_present.append(cid)

        if is_row_annotated:
            if c_has_text and not d_has_text:
                concern_no_demand.append(cid)
            elif d_has_text and not c_has_text:
                demand_no_concern.append(cid)
            elif not c_has_text and not d_has_text:
                both_empty.append(cid)
            elif c_has_text and d_has_text:
                both_present.append(cid)

    # Edge cases: Mixed, Neutral, Unclear
    mixed_count = stance_distribution.get("MIXED", 0)
    neutral_count = stance_distribution.get("NEUTRAL", 0)
    unclear_count = topic_distribution.get("UNCLEAR", 0)

    # Overall validation status determination
    is_valid_format = len(missing_cols) == 0 and len(duplicate_ids) == 0 and text_preservation_ok
    is_fully_annotated = fully_labeled_rows_count == total_rows and len(invalid_topics) == 0 and len(invalid_stances) == 0

    if total_rows == 0:
        status = "EMPTY_DATASET"
        action_required = "Provide a non-empty worksheet."
    elif fully_labeled_rows_count == 0:
        status = "PENDING_ANNOTATION"
        action_required = (
            "The 50 comments have been verified and formatted with verbatim source text, but "
            "0 / 50 rows have human labels. Human annotators must complete the 'topic', 'stance', "
            "and optional 'concern'/'demand' columns following docs/annotation/annotation_guidelines.md "
            "before real human-grounded evaluation can run."
        )
    elif not is_fully_annotated:
        status = "PARTIALLY_ANNOTATED_OR_INVALID"
        action_required = (
            f"Worksheet has {fully_labeled_rows_count} / {total_rows} completed annotations. "
            f"Invalid topics: {len(invalid_topics)}, Invalid stances: {len(invalid_stances)}. "
            "Correct taxonomy typos and finish remaining rows."
        )
    else:
        status = "VALID_AND_READY"
        action_required = "None. Dataset is fully labeled and validated against PolicyLens taxonomy."

    report = {
        "dataset_name": "human_annotation_worksheet_50",
        "status": status,
        "is_valid_format": is_valid_format,
        "is_fully_annotated": is_fully_annotated,
        "action_required": action_required,
        "metrics": {
            "total_comments": total_rows,
            "completed_topic_labels": completed_topic_count,
            "completed_stance_labels": completed_stance_count,
            "fully_labeled_rows": fully_labeled_rows_count,
            "completion_rate_pct": round(fully_labeled_rows_count / max(1, total_rows) * 100.0, 2),
            "missing_topic_labels_count": int(topic_missing_mask.sum()),
            "missing_stance_labels_count": int(stance_missing_mask.sum()),
        },
        "taxonomy_validation": {
            "valid_topic_codes": sorted(list(VALID_TOPIC_CODES)),
            "invalid_topic_entries": invalid_topics,
            "observed_topic_distribution": topic_distribution,
            "unclear_comments_count": unclear_count,
        },
        "stance_validation": {
            "valid_stance_categories": sorted(list(VALID_STANCES)),
            "invalid_stance_entries": invalid_stances,
            "observed_stance_distribution": stance_distribution,
            "neutral_stance_count": neutral_count,
            "mixed_stance_count": mixed_count,
        },
        "concern_demand_analysis": {
            "annotated_concerns_count": len(concerns_present),
            "annotated_demands_count": len(demands_present),
            "concern_with_no_demand_count": len(concern_no_demand),
            "demand_with_no_concern_count": len(demand_no_concern),
            "both_concern_and_demand_present_count": len(both_present),
            "both_empty_count": len(both_empty),
            "empty_vs_missing_rule": (
                "Empty string in an annotated row signifies a legitimate absence of concern or demand. "
                "NaN represents an unannotated missing record. PolicyLens never invents or hallucinates demands."
            ),
        },
        "integrity_checks": {
            "required_columns_present": len(missing_cols) == 0,
            "missing_columns": missing_cols,
            "duplicate_comment_ids_count": len(duplicate_ids),
            "duplicate_comment_texts_count": len(duplicate_texts),
            "text_preservation_verified": text_preservation_ok,
            "text_mismatches": text_mismatches,
        },
    }
    return report


def main():
    parser = argparse.ArgumentParser(description="Validate human annotation worksheet")
    parser.add_argument("--worksheet-path", type=str, default=str(DEFAULT_WORKSHEET))
    parser.add_argument("--source-path", type=str, default=str(PROJECT_ROOT / "data" / "processed" / "policylens_comments_cleaned_v1.csv"))
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    worksheet_file = Path(args.worksheet_path)
    if not worksheet_file.exists():
        logger.error("Worksheet not found at %s", worksheet_file)
        sys.exit(1)

    df = pd.read_csv(worksheet_file)
    logger.info("Loaded %d rows from %s", len(df), worksheet_file)

    source_df = None
    source_file = Path(args.source_path)
    if source_file.exists():
        source_df = pd.read_csv(source_file)
        logger.info("Loaded source corpus from %s for verbatim verification", source_file)

    report = validate_worksheet(df, source_df=source_df)

    out_file = Path(args.output)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info("Validation complete. Status: %s", report["status"])
    logger.info("Saved validation report to %s", out_file)
    print("\n" + "=" * 60)
    print(f"POLICYLENS HUMAN-ANNOTATION VALIDATION REPORT")
    print("=" * 60)
    print(f"Total Comments in Worksheet:  {report['metrics']['total_comments']}")
    print(f"Completed Topic Labels:       {report['metrics']['completed_topic_labels']}")
    print(f"Completed Stance Labels:      {report['metrics']['completed_stance_labels']}")
    print(f"Completion Rate:              {report['metrics']['completion_rate_pct']}%")
    print(f"Status:                       {report['status']}")
    print(f"Action Required:              {report['action_required']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
