#!/usr/bin/env python3
"""
PolicyLens — Human Annotation & Model Evaluation Script
Compares human-reviewed ground truth labels against model-generated clusters,
sentiment/stance predictions, and candidate concern/demand summaries.

Metrics Evaluated:
1. Completion & Data Quality Audit (counts missing/unannotated rows).
2. Topic vs. Cluster Agreement (Cluster Purity, Adjusted Rand Index, Normalized Mutual Information).
3. Stance / Sentiment Alignment (Accuracy, Macro-F1, Cohen's Kappa, Confusion Matrix).
4. Concern & Demand Extraction Quality (Exact Blank Agreement, Lexical Overlap / Jaccard).
5. Inter-Annotator Agreement (Cohen's Kappa when multiple annotators are present).

Usage:
    python experiments/semantic_clustering/evaluate_annotations.py
    python experiments/semantic_clustering/evaluate_annotations.py --dry-run-fixture
"""

import argparse
import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.metrics.cluster import adjusted_rand_score, normalized_mutual_info_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("evaluate_annotations")

EXP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = EXP_DIR.parent.parent
DATA_DIR = EXP_DIR / "dataset"
REPORTS_DIR = EXP_DIR / "reports"


def compute_cluster_purity(y_true: list[str], y_pred: list[int]) -> float:
    """Compute cluster purity: (1/N) * sum_k max_j |cluster_k intersect class_j|."""
    df_temp = pd.DataFrame({"true": y_true, "pred": y_pred})
    contingency = pd.crosstab(df_temp["pred"], df_temp["true"])
    purity = contingency.max(axis=1).sum() / len(y_true)
    return float(purity)


def compute_lexical_jaccard(str1: str, str2: str) -> float:
    """Compute word-level Jaccard similarity between two texts."""
    tokens1 = set(str(str1).lower().split())
    tokens2 = set(str(str2).lower().split())
    if not tokens1 and not tokens2:
        return 1.0
    if not tokens1 or not tokens2:
        return 0.0
    return float(len(tokens1 & tokens2) / len(tokens1 | tokens2))


def evaluate_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """Run full evaluation suite on an annotated DataFrame."""
    total_rows = len(df)
    annotated_topic_mask = df["topic"].notna() & (df["topic"].astype(str).str.strip() != "")
    annotated_stance_mask = df["stance"].notna() & (df["stance"].astype(str).str.strip() != "")
    annotated_concern_mask = df["concern"].notna() & (df["concern"].astype(str).str.strip() != "")
    annotated_demand_mask = df["demand"].notna() & (df["demand"].astype(str).str.strip() != "")

    completion_status = {
        "total_rows": int(total_rows),
        "annotated_topics_count": int(annotated_topic_mask.sum()),
        "annotated_stances_count": int(annotated_stance_mask.sum()),
        "annotated_concerns_count": int(annotated_concern_mask.sum()),
        "annotated_demands_count": int(annotated_demand_mask.sum()),
        "completion_rate_pct": round(float(annotated_topic_mask.sum()) / total_rows * 100, 2) if total_rows > 0 else 0.0,
        "is_fully_annotated": bool(annotated_topic_mask.all() and annotated_stance_mask.all())
    }

    if annotated_topic_mask.sum() == 0:
        return {
            "status": "PENDING_HUMAN_ANNOTATION",
            "message": "The worksheet contains zero completed human annotations. Waiting for human coders.",
            "completion_status": completion_status
        }

    # Restrict to annotated rows for metrics
    eval_df = df[annotated_topic_mask].copy()

    # 1. Topic vs Cluster Evaluation
    purity = compute_cluster_purity(eval_df["topic"].tolist(), eval_df["cluster_id"].tolist())
    ari = float(adjusted_rand_score(eval_df["topic"].tolist(), eval_df["cluster_id"].tolist()))
    nmi = float(normalized_mutual_info_score(eval_df["topic"].tolist(), eval_df["cluster_id"].tolist()))

    topic_metrics = {
        "cluster_purity": round(purity, 4),
        "adjusted_rand_index": round(ari, 4),
        "normalized_mutual_info": round(nmi, 4),
        "unique_human_topics": eval_df["topic"].nunique(),
        "topic_distribution": eval_df["topic"].value_counts().to_dict()
    }

    # 2. Stance Evaluation (if stance annotated)
    stance_metrics = {}
    if annotated_stance_mask.sum() > 0:
        stance_df = df[annotated_stance_mask].copy()
        stance_metrics["unique_human_stances"] = stance_df["stance"].nunique()
        stance_metrics["stance_distribution"] = stance_df["stance"].value_counts().to_dict()

        # If a model_stance prediction column exists, compute alignment metrics
        if "model_stance" in stance_df.columns:
            acc = float(accuracy_score(stance_df["stance"], stance_df["model_stance"]))
            macro_f1 = float(f1_score(stance_df["stance"], stance_df["model_stance"], average="macro", zero_division=0))
            kappa = float(cohen_kappa_score(stance_df["stance"], stance_df["model_stance"]))
            labels = sorted(list(set(stance_df["stance"].unique()) | set(stance_df["model_stance"].unique())))
            cm = confusion_matrix(stance_df["stance"], stance_df["model_stance"], labels=labels)
            stance_metrics.update({
                "model_accuracy": round(acc, 4),
                "model_macro_f1": round(macro_f1, 4),
                "cohen_kappa": round(kappa, 4),
                "confusion_matrix_labels": labels,
                "confusion_matrix": cm.tolist()
            })

    # 3. Concern and Demand Evaluation
    extraction_metrics = {}
    # Measure blank demand agreement (does human also identify no specific demand?)
    human_has_no_demand = ~annotated_demand_mask
    if "model_has_no_demand" in df.columns:
        blank_agreement = float(accuracy_score(human_has_no_demand, df["model_has_no_demand"]))
        extraction_metrics["blank_demand_agreement_rate"] = round(blank_agreement, 4)

    # Compute average text length and lexical overlap if candidate text exists
    if "candidate_concern" in eval_df.columns:
        jaccards_concern = [
            compute_lexical_jaccard(r["concern"], r["candidate_concern"])
            for _, r in eval_df.iterrows()
            if str(r.get("concern", "")).strip()
        ]
        extraction_metrics["mean_concern_jaccard_overlap"] = round(float(np.mean(jaccards_concern)), 4) if jaccards_concern else 0.0

    if "candidate_demand" in eval_df.columns:
        jaccards_demand = [
            compute_lexical_jaccard(r["demand"], r["candidate_demand"])
            for _, r in eval_df.iterrows()
            if str(r.get("demand", "")).strip()
        ]
        extraction_metrics["mean_demand_jaccard_overlap"] = round(float(np.mean(jaccards_demand)), 4) if jaccards_demand else 0.0

    # 4. Multi-Annotator Agreement (if annotator_2 present)
    inter_annotator = {}
    if "topic_annotator_2" in eval_df.columns:
        mask_both = eval_df["topic"].notna() & eval_df["topic_annotator_2"].notna()
        if mask_both.sum() > 0:
            both_df = eval_df[mask_both]
            kappa_topic = float(cohen_kappa_score(both_df["topic"], both_df["topic_annotator_2"]))
            pct_agree = float(accuracy_score(both_df["topic"], both_df["topic_annotator_2"]))
            inter_annotator["topic_cohen_kappa"] = round(kappa_topic, 4)
            inter_annotator["topic_percentage_agreement"] = round(pct_agree, 4)

    return {
        "status": "COMPLETED_EVALUATION",
        "completion_status": completion_status,
        "topic_clustering_evaluation": topic_metrics,
        "stance_evaluation": stance_metrics,
        "concern_demand_extraction_evaluation": extraction_metrics,
        "inter_annotator_agreement": inter_annotator
    }


def create_dry_run_fixture() -> pd.DataFrame:
    """Generate a realistic 50-row mock completed annotation fixture for testing code paths."""
    np.random.seed(42)
    topics = ["OPEN_DATA", "TRANSPARENCY", "PARTICIPATION", "ACCOUNTABILITY", "PRIVACY_SECURITY", "OTHER"]
    stances = ["SUPPORT", "OPPOSE", "NEUTRAL", "MIXED"]

    data = []
    for i in range(50):
        c_id = i % 9
        true_top = topics[c_id % len(topics)]
        # Add realistic noise for cluster vs topic
        assigned_topic = true_top if np.random.rand() > 0.15 else np.random.choice(topics)
        assigned_stance = np.random.choice(stances, p=[0.45, 0.30, 0.15, 0.10])
        model_stance = assigned_stance if np.random.rand() > 0.20 else np.random.choice(stances)

        has_demand = np.random.rand() > 0.35  # ~35% have no demand
        data.append({
            "comment_id": f"mock_comment_{i+1:03d}",
            "cluster_id": c_id,
            "comment": f"Sample feedback comment text regarding policy domain {assigned_topic}.",
            "topic": assigned_topic,
            "stance": assigned_stance,
            "concern": f"Specific barrier identified in {assigned_topic}." if np.random.rand() > 0.1 else "",
            "demand": f"Mandate action regarding {assigned_topic}." if has_demand else "",
            "model_stance": model_stance,
            "candidate_concern": f"Specific barrier identified in {assigned_topic}.",
            "candidate_demand": f"Mandate action regarding {assigned_topic}." if has_demand else "",
            "model_has_no_demand": not has_demand,
            "topic_annotator_2": assigned_topic if np.random.rand() > 0.10 else np.random.choice(topics)
        })

    return pd.DataFrame(data)


def main():
    parser = argparse.ArgumentParser(description="Evaluate PolicyLens human annotations against models.")
    parser.add_argument("--annotations", type=str, default=str(DATA_DIR / "human_annotation_worksheet_50.csv"),
                        help="Path to human annotation CSV worksheet.")
    parser.add_argument("--output", type=str, default=str(REPORTS_DIR / "annotation_evaluation_report.json"),
                        help="Path to save evaluation output JSON.")
    parser.add_argument("--dry-run-fixture", action="store_true",
                        help="Run evaluation on synthetic completed fixture to test all metric computations.")
    args = parser.parse_args()

    if args.dry_run_fixture:
        logger.info("Running dry-run evaluation on 50-row synthetic completed fixture...")
        fixture_df = create_dry_run_fixture()
        results = evaluate_dataframe(fixture_df)
        logger.info("Dry-run results:\n%s", json.dumps(results, indent=2))
        return results

    csv_path = Path(args.annotations)
    if not csv_path.exists():
        logger.error("Annotation worksheet not found at %s", csv_path)
        raise FileNotFoundError(f"Missing file: {csv_path}")

    logger.info("Loading annotation worksheet from %s...", csv_path)
    df = pd.read_csv(csv_path)

    # 1. Join candidate concern and action from issue summary table if missing
    summary_csv = REPORTS_DIR / "policylens_issue_summary_table.csv"
    if summary_csv.exists() and "candidate_concern" not in df.columns and "cluster_id" in df.columns:
        logger.info("Joining candidate concern and requested action from %s...", summary_csv)
        summary_df = pd.read_csv(summary_csv)
        join_cols = ["cluster_id"]
        for c in ["candidate_concern", "candidate_requested_action"]:
            if c in summary_df.columns:
                join_cols.append(c)
        df = df.merge(summary_df[join_cols], on="cluster_id", how="left")
        if "candidate_requested_action" in df.columns and "candidate_demand" not in df.columns:
            df["candidate_demand"] = df["candidate_requested_action"]

    # 2. Compute model stance predictions from sentiment baseline if missing
    models_dir = PROJECT_ROOT / "experiments" / "sentiment_baseline" / "models"
    if "model_stance" not in df.columns and "comment" in df.columns and models_dir.exists():
        vec_path = models_dir / "tfidf_vectorizer.joblib"
        clf_path = models_dir / "logistic_regression_balanced.joblib"
        if vec_path.exists() and clf_path.exists():
            try:
                import joblib
                logger.info("Generating baseline model stance predictions using %s...", clf_path.name)
                vec = joblib.load(vec_path)
                clf = joblib.load(clf_path)
                X = vec.transform(df["comment"].fillna(""))
                raw_preds = clf.predict(X)
                # Map sentiment classes to policy stance codes
                stance_map = {"Positive": "SUPPORT", "Negative": "OPPOSE", "Neutral": "NEUTRAL"}
                df["model_stance"] = [stance_map.get(p, p) for p in raw_preds]
            except Exception as e:
                logger.warning("Could not compute model stance predictions: %s", e)

    results = evaluate_dataframe(df)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info("Saved evaluation report to %s", out_path)
    logger.info("Status: %s", results["status"])
    if results["status"] == "PENDING_HUMAN_ANNOTATION":
        logger.info("Summary: %s", results["message"])
        logger.info("Completion: %d / %d (%.1f%%)",
                    results["completion_status"]["annotated_topics_count"],
                    results["completion_status"]["total_rows"],
                    results["completion_status"]["completion_rate_pct"])
    else:
        logger.info("Completed evaluation: Cluster Purity=%.4f, ARI=%.4f, NMI=%.4f",
                    results["topic_clustering_evaluation"]["cluster_purity"],
                    results["topic_clustering_evaluation"]["adjusted_rand_index"],
                    results["topic_clustering_evaluation"]["normalized_mutual_info"])

    return results


if __name__ == "__main__":
    main()
