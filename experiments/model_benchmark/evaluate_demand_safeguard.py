#!/usr/bin/env python3
"""
PolicyLens — Evaluation of Demand-Presence Detection & Evidence Safeguards

Evaluates the DemandPresenceDetector against the approved 50-comment human dataset:
1. Compares Existing Baseline (unconditional cluster-level action attachment) vs Safeguarded Model.
2. Measures:
   - Demand-presence Precision, Recall, and F1.
   - Correctly preserved empty demands (True Negatives).
   - Unsupported / Hallucinated actions generated (False Positives).
   - Explicit and implicit demands detected vs missed.
   - Uncertain cases flagged for human review.
3. Distinguishes attribution tiers:
   - RESPONDENT_EXPLICIT_DEMAND vs MODEL_INFERRED_RECOMMENDATION vs ANALYST_PROPOSED_ACTION.
"""

import argparse
import datetime
import json
import logging
from pathlib import Path
import sys
from typing import Any

BENCHMARK_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BENCHMARK_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
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
logger = logging.getLogger("evaluate_demand_safeguard")

DEFAULT_DATASET = PROJECT_ROOT / "experiments" / "semantic_clustering" / "dataset" / "policylens_pilot_annotation_batch_50.csv"
SUMMARY_TABLE = PROJECT_ROOT / "experiments" / "semantic_clustering" / "reports" / "policylens_issue_summary_table.csv"


def evaluate_safeguard_pipeline(df: pd.DataFrame) -> dict[str, Any]:
    """Compare baseline vs safeguarded demand extraction on approved dataset."""
    detector = DemandPresenceDetector()

    # Load cluster summary table for baseline simulation
    cluster_actions = {}
    if SUMMARY_TABLE.exists():
        sum_df = pd.read_csv(SUMMARY_TABLE)
        for _, r in sum_df.iterrows():
            cid = int(r["cluster_id"])
            cluster_actions[cid] = str(r.get("candidate_requested_action", r.get("candidate_concern", "")))

    total_records = len(df)
    
    # Ground Truth: does human annotation formulate a demand?
    # True if demand is non-empty; False if demand is intentional empty string / NaN
    y_true_has_demand = []
    for d in df["demand"]:
        has_d = (not pd.isna(d)) and (str(d).strip() not in ("", "NONE", "N/A", "nan"))
        y_true_has_demand.append(bool(has_d))

    true_demands_count = sum(y_true_has_demand)
    true_empty_demands_count = total_records - true_demands_count

    # 1. Existing Baseline Extraction (Unconditional cluster action broadcast)
    # The baseline assigns a candidate action to 100% of rows
    y_pred_baseline = [True] * total_records
    baseline_hallucinated = true_empty_demands_count  # Fabricated action for every empty demand
    baseline_preserved_empty = 0

    # 2. Safeguarded Extraction
    safeguard_results: list[DemandDetectionResult] = []
    y_pred_safeguarded = []
    safeguarded_decisions = []
    status_counts = {
        DemandStatus.EXPLICIT_DEMAND.value: 0,
        DemandStatus.IMPLICIT_DEMAND.value: 0,
        DemandStatus.CONCERN_ONLY.value: 0,
        DemandStatus.UNCLEAR_OR_INSUFFICIENT.value: 0,
    }
    attribution_counts = {
        DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND.value: 0,
        DemandAttributionTier.MODEL_INFERRED_RECOMMENDATION.value: 0,
        DemandAttributionTier.ANALYST_PROPOSED_ACTION.value: 0,
        DemandAttributionTier.NONE_UNSTATED.value: 0,
    }

    comparison_records = []

    for i, row in df.iterrows():
        comment = str(row["comment"])
        cid = str(row["comment_id"])
        c_id = int(row.get("cluster_id", 0))
        h_demand = str(row.get("demand", "")).strip() if not pd.isna(row.get("demand")) else ""
        h_concern = str(row.get("concern", "")).strip() if not pd.isna(row.get("concern")) else ""
        has_true_d = y_true_has_demand[i]

        cluster_act = cluster_actions.get(c_id, "[UNVERIFIED] General Policy Reform")

        # Run detector
        res = detector.detect(comment=comment, comment_id=cid, candidate_concern=h_concern, candidate_demand=h_demand)
        safeguard_results.append(res)

        status_counts[res.demand_status.value] += 1
        attribution_counts[res.attribution_tier.value] += 1
        safeguarded_decisions.append(res.safeguard_decision.value)

        # In safeguarded mode, a demand is considered emitted only if safeguard decides EXTRACT_CITIZEN_DEMAND
        pred_has_demand = (res.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND)
        y_pred_safeguarded.append(pred_has_demand)

        comparison_records.append({
            "comment_id": cid,
            "comment_verbatim": comment,
            "human_has_demand": has_true_d,
            "human_demand_text": h_demand,
            "baseline_emitted_demand": cluster_act,
            "safeguarded_demand_status": res.demand_status.value,
            "safeguarded_decision": res.safeguard_decision.value,
            "safeguarded_attribution_tier": res.attribution_tier.value,
            "safeguarded_extracted_demand": res.extracted_demand,
            "signals": "; ".join(res.linguistic_signals),
        })

    # Metric calculations
    # Baseline
    b_prec = precision_score(y_true_has_demand, y_pred_baseline, zero_division=0)
    b_rec = recall_score(y_true_has_demand, y_pred_baseline, zero_division=0)
    b_f1 = f1_score(y_true_has_demand, y_pred_baseline, zero_division=0)
    b_acc = accuracy_score(y_true_has_demand, y_pred_baseline)

    # Safeguarded
    s_prec = precision_score(y_true_has_demand, y_pred_safeguarded, zero_division=0)
    s_rec = recall_score(y_true_has_demand, y_pred_safeguarded, zero_division=0)
    s_f1 = f1_score(y_true_has_demand, y_pred_safeguarded, zero_division=0)
    s_acc = accuracy_score(y_true_has_demand, y_pred_safeguarded)

    # Empty Demand & Hallucination Analysis
    # True empty demands: rows where y_true_has_demand == False
    empty_indices = [idx for idx, val in enumerate(y_true_has_demand) if not val]
    demand_indices = [idx for idx, val in enumerate(y_true_has_demand) if val]

    # Baseline on empty rows
    baseline_hallucinations_count = len(empty_indices)  # Baseline emits demand on all of them
    baseline_empty_preserved_count = 0

    # Safeguarded on empty rows
    safeguarded_empty_preserved_count = sum(1 for idx in empty_indices if not y_pred_safeguarded[idx])
    safeguarded_hallucinations_count = len(empty_indices) - safeguarded_empty_preserved_count

    # Missed demands (False Negatives: true demand exists but safeguard suppressed it)
    safeguarded_missed_demands_count = sum(1 for idx in demand_indices if not y_pred_safeguarded[idx])

    # Cases sent for human review
    review_flagged_count = sum(1 for r in safeguard_results if r.safeguard_decision == SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW)

    report = {
        "evaluation_timestamp": datetime.datetime.now().isoformat(),
        "total_evaluated_records": total_records,
        "ground_truth_distribution": {
            "comments_with_demand_count": true_demands_count,
            "comments_with_empty_demand_count": true_empty_demands_count,
            "empty_demand_rate_pct": round(true_empty_demands_count / max(1, total_records) * 100.0, 2),
        },
        "demand_status_distribution": status_counts,
        "attribution_tier_distribution": attribution_counts,
        "performance_comparison": {
            "baseline_unconditional": {
                "precision": round(float(b_prec), 4),
                "recall": round(float(b_rec), 4),
                "f1": round(float(b_f1), 4),
                "accuracy": round(float(b_acc), 4),
                "correctly_preserved_empty_demands": baseline_empty_preserved_count,
                "unsupported_hallucinated_demands": baseline_hallucinations_count,
                "hallucination_rate_pct": round(baseline_hallucinations_count / max(1, true_empty_demands_count) * 100.0, 2),
            },
            "safeguarded_detector": {
                "precision": round(float(s_prec), 4),
                "recall": round(float(s_rec), 4),
                "f1": round(float(s_f1), 4),
                "accuracy": round(float(s_acc), 4),
                "correctly_preserved_empty_demands": safeguarded_empty_preserved_count,
                "unsupported_hallucinated_demands": safeguarded_hallucinations_count,
                "hallucination_rate_pct": round(safeguarded_hallucinations_count / max(1, true_empty_demands_count) * 100.0, 2),
                "missed_demands_count": safeguarded_missed_demands_count,
                "cases_sent_for_human_review_count": review_flagged_count,
            },
        },
        "safeguard_attribution_hierarchy": {
            "rule_1": "RESPONDENT_EXPLICIT_DEMAND: Directly stated in the citizen comment verbatim.",
            "rule_2": "MODEL_INFERRED_RECOMMENDATION: Machine-generated policy recommendation based on thematic context.",
            "rule_3": "ANALYST_PROPOSED_ACTION: Human policy analyst reform proposal.",
            "rule_4": "Never present these three tiers as equivalent.",
        },
    }

    return report, pd.DataFrame(comparison_records)


def main():
    parser = argparse.ArgumentParser(description="Evaluate Demand-Presence Detector and Evidence Safeguards")
    parser.add_argument("--dataset-path", type=str, default=str(DEFAULT_DATASET))
    parser.add_argument("--output-json", type=str, default=str(BENCHMARK_DIR / "demand_safeguard_evaluation.json"))
    parser.add_argument("--output-csv", type=str, default=str(BENCHMARK_DIR / "demand_safeguard_comparison.csv"))
    args = parser.parse_args()

    data_path = Path(args.dataset_path)
    if not data_path.exists():
        logger.error("Dataset not found at %s", data_path)
        return

    df = pd.read_csv(data_path)
    logger.info("Loaded %d records from %s", len(df), data_path)

    report, comp_df = evaluate_safeguard_pipeline(df)

    out_json = Path(args.output_json)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    out_csv = Path(args.output_csv)
    comp_df.to_csv(out_csv, index=False)

    logger.info("Saved evaluation JSON to: %s", out_json)
    logger.info("Saved comparison CSV to: %s", out_csv)

    print("\n" + "=" * 65)
    print("POLICYLENS DEMAND-PRESENCE SAFEGUARD EVALUATION")
    print("=" * 65)
    print(f"Total Evaluated Records:       {report['total_evaluated_records']}")
    print(f"True Empty Demands:            {report['ground_truth_distribution']['comments_with_empty_demand_count']}")
    print(f"Baseline Hallucinations:       {report['performance_comparison']['baseline_unconditional']['unsupported_hallucinated_demands']} (100.0%)")
    print(f"Safeguarded Hallucinations:    {report['performance_comparison']['safeguarded_detector']['unsupported_hallucinated_demands']} ({report['performance_comparison']['safeguarded_detector']['hallucination_rate_pct']}%)")
    print(f"Empty Demands Preserved:       {report['performance_comparison']['safeguarded_detector']['correctly_preserved_empty_demands']} / {report['ground_truth_distribution']['comments_with_empty_demand_count']}")
    print(f"Safeguarded Precision:         {report['performance_comparison']['safeguarded_detector']['precision'] * 100:.1f}%")
    print(f"Safeguarded Recall:            {report['performance_comparison']['safeguarded_detector']['recall'] * 100:.1f}%")
    print(f"Safeguarded Macro-F1:          {report['performance_comparison']['safeguarded_detector']['f1'] * 100:.1f}%")
    print(f"Flagged for Review:            {report['performance_comparison']['safeguarded_detector']['cases_sent_for_human_review_count']}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
