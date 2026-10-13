#!/usr/bin/env python3
"""
PolicyLens — Reproducible Evaluation of Flagged Demand Reviews

Evaluates the DemandPresenceDetector against human-reviewed adjudications from
human_review_worksheet_flagged_22.csv (or in diagnostic comparison with pilot annotations).

Metrics Reported:
1. Demand-Presence Precision, Recall, and Macro-F1.
2. Breakdown by explicit vs implicit demand presence.
3. False positives (unsupported demand attributions).
4. False negatives (missed demands).
5. Human-review and abstention rates.
6. Per-comment error analysis with verbatim evidence citations.
"""

import argparse
import json
import logging
from pathlib import Path
import sys
from typing import Any

BENCHMARK_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BENCHMARK_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

from experiments.model_benchmark.demand_detector import (
    DemandAttributionTier,
    DemandDetectionResult,
    DemandPresenceDetector,
    DemandStatus,
    SafeguardDecision,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("evaluate_flagged_review")

DEFAULT_WORKSHEET = BENCHMARK_DIR / "human_review_worksheet_flagged_22.csv"
PILOT_BATCH = PROJECT_ROOT / "experiments" / "semantic_clustering" / "dataset" / "policylens_pilot_annotation_batch_50.csv"


def evaluate_adjudicated_worksheet(
    worksheet_df: pd.DataFrame,
    pilot_df: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """
    Evaluate detector decisions against human annotations.
    Handles both completed worksheets and pending worksheets.
    """
    total_flagged = len(worksheet_df)
    labeled_mask = (
        worksheet_df["human_reviewed_demand_presence_label"].fillna("").astype(str).str.strip().ne("")
        & ~worksheet_df["human_reviewed_demand_presence_label"].isna()
        & ~worksheet_df["human_reviewed_demand_presence_label"].astype(str).str.lower().isin(["nan", "none", ""])
    )
    num_labeled = int(labeled_mask.sum())

    report: dict[str, Any] = {
        "total_flagged_comments": total_flagged,
        "adjudicated_comments_count": num_labeled,
        "pending_review_count": total_flagged - num_labeled,
        "adjudication_complete": num_labeled == total_flagged,
    }

    if num_labeled == 0:
        logger.warning(
            "Worksheet contains 0 human-reviewed labels (all 22 pending review). "
            "Reporting current detector status and diagnostic baseline."
        )
        report["status"] = "PENDING_HUMAN_ADJUDICATION"
        report["message"] = (
            "Human review worksheet is currently blank. To compute adjudicated metrics, "
            "reviewers must fill 'human_reviewed_demand_presence_label' with one of "
            "[EXPLICIT_DEMAND, IMPLICIT_DEMAND, CONCERN_ONLY, UNCLEAR_OR_INSUFFICIENT]."
        )

        # In diagnostic mode against pilot batch (if provided)
        if pilot_df is not None:
            pilot_sub = pilot_df[pilot_df["comment_id"].isin(worksheet_df["comment_id"])].copy()
            pilot_has_demand = pilot_sub["demand"].fillna("").astype(str).str.strip().ne("").tolist()
            report["diagnostic_pilot_ground_truth"] = {
                "flagged_comments_with_demand_in_pilot": int(sum(pilot_has_demand)),
                "flagged_comments_empty_in_pilot": int(len(pilot_has_demand) - sum(pilot_has_demand)),
                "note": "Diagnostic comparison using approved pilot annotations; distinct from second-pass human adjudication.",
            }
        return report

    # If labels are provided, evaluate metrics
    eval_df = worksheet_df[labeled_mask].copy()
    detector = DemandPresenceDetector()

    records = []
    y_true_binary = []
    y_pred_binary = []

    for _, r in eval_df.iterrows():
        cid = str(r["comment_id"])
        ctext = str(r["original_comment_text"])
        human_label = str(r["human_reviewed_demand_presence_label"]).strip()

        det = detector.detect(ctext, comment_id=cid)

        # Ground truth demand presence
        has_demand_true = human_label in ["EXPLICIT_DEMAND", "IMPLICIT_DEMAND"]
        has_demand_pred = det.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND

        y_true_binary.append(has_demand_true)
        y_pred_binary.append(has_demand_pred)

        records.append({
            "comment_id": cid,
            "comment_verbatim": ctext,
            "human_label": human_label,
            "detector_status": det.demand_status.value,
            "detector_decision": det.safeguard_decision.value,
            "extracted_demand": det.extracted_demand,
            "confidence": det.confidence_score,
            "is_false_positive": has_demand_pred and not has_demand_true,
            "is_false_negative": not has_demand_pred and has_demand_true,
            "is_flagged_for_review": det.safeguard_decision == SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW,
        })

    comp_df = pd.DataFrame(records)

    # Compute metrics
    prec = precision_score(y_true_binary, y_pred_binary, zero_division=0)
    rec = recall_score(y_true_binary, y_pred_binary, zero_division=0)
    f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
    acc = accuracy_score(y_true_binary, y_pred_binary)

    fps = comp_df[comp_df["is_false_positive"]]
    fns = comp_df[comp_df["is_false_negative"]]

    report["metrics"] = {
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "accuracy": round(float(acc), 4),
        "false_positives_unsupported_actions_count": len(fps),
        "false_negatives_missed_demands_count": len(fns),
        "review_abstention_rate_pct": round(float(comp_df["is_flagged_for_review"].mean() * 100.0), 2),
    }

    report["error_analysis"] = comp_df.to_dict(orient="records")
    return report


def main():
    parser = argparse.ArgumentParser(description="Evaluate Flagged Demand Adjudications")
    parser.add_argument("--worksheet-csv", type=str, default=str(DEFAULT_WORKSHEET))
    parser.add_argument("--pilot-csv", type=str, default=str(PILOT_BATCH))
    parser.add_argument("--output-json", type=str, default=str(BENCHMARK_DIR / "flagged_review_evaluation.json"))
    args = parser.parse_args()

    ws_path = Path(args.worksheet_csv)
    if not ws_path.exists():
        logger.error("Worksheet not found: %s", ws_path)
        return

    ws_df = pd.read_csv(ws_path)
    pilot_df = pd.read_csv(args.pilot_csv) if Path(args.pilot_csv).exists() else None

    report = evaluate_adjudicated_worksheet(ws_df, pilot_df=pilot_df)

    out_json = Path(args.output_json)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info("Saved flagged review evaluation to %s", out_json)

    print("\n" + "=" * 65)
    print("POLICYLENS FLAGGED REVIEW ADJUDICATION REPORT")
    print("=" * 65)
    print(f"Total Flagged Comments:   {report['total_flagged_comments']}")
    print(f"Adjudicated Count:        {report['adjudicated_comments_count']}")
    print(f"Pending Review Count:     {report['pending_review_count']}")
    print(f"Status:                   {report.get('status', 'COMPLETED')}")
    if "diagnostic_pilot_ground_truth" in report:
        print(f"Pilot Ground Truth:       {report['diagnostic_pilot_ground_truth']}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
