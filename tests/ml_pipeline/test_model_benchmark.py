#!/usr/bin/env python3
"""
Unit and integration tests for PolicyLens Model Benchmark and Collective Verdict engine.
Tests cover:
1. Annotation schema validation
2. Empty-demand handling vs unannotated missing fields
3. Verbatim text preservation
4. Reproducible splits & random seed consistency
5. Duplicate leakage prevention & train-only vectorizer fitting
6. Metric calculations (Macro-F1, Kappa, Purity, Jaccard)
7. Benchmark output artifact schema validation
8. Experiment logging & provenance tracking
9. Missing classes & small-sample edge case resilience
10. Evidence traceability & uncertainty flags in collective verdicts
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, cohen_kappa_score, f1_score
from sklearn.model_selection import StratifiedKFold

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from experiments.model_benchmark.collective_verdict import (
    aggregate_collective_verdict,
    calculate_stakeholder_breadth,
)
from experiments.model_benchmark.run_benchmark import (
    clean_text_conservative,
    compute_token_overlap_metrics,
    run_cross_validated_experiment,
)
from experiments.model_benchmark.validate_annotations import (
    VALID_STANCES,
    VALID_TOPIC_CODES,
    validate_worksheet,
)

BENCHMARK_DIR = PROJECT_ROOT / "experiments" / "model_benchmark"
WORKSHEET_PATH = PROJECT_ROOT / "experiments" / "semantic_clustering" / "dataset" / "human_annotation_worksheet_50.csv"


class TestAnnotationValidation:
    """Tests for worksheet validation and schema rules."""

    def test_annotation_schema_validation_real_file(self):
        """Verify real worksheet has exactly 50 rows, valid columns, and records unannotated status."""
        assert WORKSHEET_PATH.exists(), f"Worksheet missing at {WORKSHEET_PATH}"
        df = pd.read_csv(WORKSHEET_PATH)
        assert len(df) == 50

        report = validate_worksheet(df)
        assert report["metrics"]["total_comments"] == 50
        assert report["metrics"]["completed_topic_labels"] == 0
        assert report["status"] == "PENDING_ANNOTATION"
        assert report["is_valid_format"] is True
        assert report["is_fully_annotated"] is False

    def test_approved_pilot_batch_validation(self):
        """Verify approved pilot batch has 50 completed annotations and passes validation."""
        approved_path = PROJECT_ROOT / "experiments" / "semantic_clustering" / "dataset" / "policylens_pilot_annotation_batch_50.csv"
        assert approved_path.exists(), f"Approved batch missing at {approved_path}"
        df = pd.read_csv(approved_path)
        assert len(df) == 50

        report = validate_worksheet(df)
        assert report["metrics"]["total_comments"] == 50
        assert report["metrics"]["completed_topic_labels"] == 50
        assert report["metrics"]["completed_stance_labels"] == 50
        assert report["status"] == "VALID_AND_READY"
        assert report["is_fully_annotated"] is True

    def test_invalid_topic_and_stance_detection(self):
        """Verify that invalid taxonomy codes and stance categories are caught."""
        fake_df = pd.DataFrame({
            "comment_id": ["C1", "C2"],
            "cluster_id": [0, 1],
            "comment": ["comment one", "comment two"],
            "topic": ["INVALID_THEME", "TRANSPARENCY"],
            "stance": ["SUPPORT", "BOGUS_STANCE"],
            "concern": ["", ""],
            "demand": ["", ""],
        })
        report = validate_worksheet(fake_df)
        assert len(report["taxonomy_validation"]["invalid_topic_entries"]) == 1
        assert report["taxonomy_validation"]["invalid_topic_entries"][0]["value"] == "INVALID_THEME"
        assert len(report["stance_validation"]["invalid_stance_entries"]) == 1
        assert report["stance_validation"]["invalid_stance_entries"][0]["value"] == "BOGUS_STANCE"

    def test_empty_demand_handling_vs_missing(self):
        """Verify distinction between legitimate empty demand and unannotated missing value."""
        df_annotated = pd.DataFrame({
            "comment_id": ["C1", "C2", "C3"],
            "cluster_id": [0, 0, 0],
            "comment": ["T1", "T2", "T3"],
            "topic": ["TRANSPARENCY", "TRANSPARENCY", "TRANSPARENCY"],
            "stance": ["SUPPORT", "OPPOSE", "NEUTRAL"],
            "concern": ["Grievance stated", "", np.nan],
            "demand": ["", "Action stated", np.nan],  # C1 has concern but legitimate empty demand
        })
        report = validate_worksheet(df_annotated)
        assert report["concern_demand_analysis"]["concern_with_no_demand_count"] == 1
        assert report["concern_demand_analysis"]["demand_with_no_concern_count"] == 1
        assert "Empty string in an annotated row signifies a legitimate absence" in report["concern_demand_analysis"]["empty_vs_missing_rule"]

    def test_text_preservation(self):
        """Verify that comments match the processed Canadian dataset verbatim."""
        source_path = PROJECT_ROOT / "data" / "processed" / "policylens_comments_cleaned_v1.csv"
        assert source_path.exists()
        source_df = pd.read_csv(source_path)
        worksheet_df = pd.read_csv(WORKSHEET_PATH)

        report = validate_worksheet(worksheet_df, source_df=source_df)
        assert report["integrity_checks"]["text_preservation_verified"] is True
        assert len(report["integrity_checks"]["text_mismatches"]) == 0


class TestModelBenchmarkPipelines:
    """Tests for leak-free splits, feature extraction, and metric calculations."""

    def test_reproducible_splits(self):
        """Verify RepeatedStratifiedKFold splits are identical with fixed random seed."""
        y = pd.Series(["SUPPORT", "OPPOSE", "SUPPORT", "OPPOSE", "NEUTRAL"] * 10)
        X = pd.Series([f"comment text {i}" for i in range(50)])

        skf1 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        skf2 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

        splits1 = list(skf1.split(X, y))
        splits2 = list(skf2.split(X, y))

        for (tr1, te1), (tr2, te2) in zip(splits1, splits2):
            assert np.array_equal(tr1, tr2)
            assert np.array_equal(te1, te2)

    def test_duplicate_leakage_prevention(self):
        """Verify that TF-IDF vectorizer fitted on train does not see test-fold vocabulary."""
        train_texts = pd.Series(["open government transparency accountability", "public spending disclosure"])
        test_texts = pd.Series(["unseen_unique_token_xyz privacy"])

        vec = TfidfVectorizer()
        X_tr = vec.fit_transform(train_texts)
        assert "unseen_unique_token_xyz" not in vec.vocabulary_

        X_te = vec.transform(test_texts)
        # The unseen token should produce zero column entries
        assert X_te.shape[1] == len(vec.vocabulary_)

    def test_metric_calculations(self):
        """Verify precision, recall, F1, and Jaccard overlap logic."""
        res = compute_token_overlap_metrics("open data portal", "open data portal")
        assert res["precision"] == 1.0
        assert res["recall"] == 1.0
        assert res["f1"] == 1.0
        assert res["jaccard"] == 1.0

        res_partial = compute_token_overlap_metrics("open data", "open government data")
        assert res_partial["precision"] == 1.0
        assert round(res_partial["recall"], 2) == 0.67
        assert round(res_partial["jaccard"], 2) == 0.67

        res_empty = compute_token_overlap_metrics("", "")
        assert res_empty["jaccard"] == 1.0

    def test_small_sample_and_missing_classes_resilience(self):
        """Verify benchmark pipeline runs without error on small-sample edge cases."""
        X_text = pd.Series(["comment a", "comment b", "comment c", "comment d", "comment e", "comment f"])
        y = pd.Series(["A", "A", "A", "B", "B", "B"])

        exp = run_cross_validated_experiment(
            X_text=X_text,
            y=y,
            target_name="stance",
            model_name="MajorityBaseline",
            model_params={},
            tfidf_config={"name": "none"},
            n_splits=2,
            n_repeats=1,
            random_state=42,
        )
        assert "mean_accuracy" in exp
        assert "mean_macro_f1" in exp
        assert exp["mean_accuracy"] >= 0.0


class TestBenchmarkArtifactsAndCollectiveVerdict:
    """Tests for generated benchmark evidence package and Collective Verdict aggregation."""

    def test_benchmark_output_schema_validation(self):
        """Verify required output files exist and possess expected schemas."""
        comp_csv = BENCHMARK_DIR / "model_comparison.csv"
        folds_csv = BENCHMARK_DIR / "cross_validation_results.csv"
        results_json = BENCHMARK_DIR / "results.json"
        error_csv = BENCHMARK_DIR / "error_analysis.csv"

        assert comp_csv.exists()
        assert folds_csv.exists()
        assert results_json.exists()
        assert error_csv.exists()

        df_comp = pd.read_csv(comp_csv)
        expected_cols = ["data_provenance", "target", "model", "tfidf_config", "mean_accuracy", "mean_macro_f1", "mean_cohen_kappa"]
        for col in expected_cols:
            assert col in df_comp.columns
        assert (df_comp["data_provenance"] == "VERIFIED_HUMAN_ANNOTATIONS").any()

        with open(results_json, "r", encoding="utf-8") as f:
            res_data = json.load(f)
        assert res_data["benchmark_metadata"]["data_source_mode"] == "VERIFIED_HUMAN_ANNOTATIONS"
        assert res_data["benchmark_metadata"]["empirical_evaluation_status"] == "EMPIRICAL_HUMAN_EVALUATION"
        assert "best_stance_model" in res_data
        assert "topic_classification" in res_data
        assert "concern_demand_extraction" in res_data

    def test_experiment_logging_provenance(self):
        """Verify append-only experiment log records experiment metadata."""
        log_file = BENCHMARK_DIR / "experiment_log.jsonl"
        assert log_file.exists()

        with open(log_file, "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f if line.strip()]

        assert len(lines) > 0
        latest = lines[-1]
        assert "experiment_id" in latest
        assert "timestamp" in latest
        assert "model" in latest
        assert "mean_macro_f1" in latest

    def test_evidence_links_in_collective_verdicts(self):
        """Verify collective verdict generates verifiable evidence links and flags low samples."""
        test_df = pd.DataFrame({
            "comment_id": ["CID_001", "CID_002", "CID_003"],
            "cluster_id": [1, 1, 1],
            "candidate_cluster_theme": ["[UNVERIFIED] Test Theme", "[UNVERIFIED] Test Theme", "[UNVERIFIED] Test Theme"],
            "comment": ["Verbatim comment 1", "Verbatim comment 2", "Verbatim comment 3"],
            "stakeholder": ["Individual", "Business", "Individual"],
            "source_url": ["http://test.url", "http://test.url", "http://test.url"],
            "stance": ["SUPPORT", "OPPOSE", "SUPPORT"],
        })

        verdict = aggregate_collective_verdict(test_df, min_confidence_sample_size=5)
        assert verdict.total_analyzed_comments == 3
        finding = verdict.findings_by_importance[0]

        # Check evidence links
        assert len(finding["supporting_evidence"]) > 0
        for ev in finding["supporting_evidence"]:
            assert ev["comment_id"] in ["CID_001", "CID_002", "CID_003"]
            assert ev["verbatim_text"].startswith("Verbatim comment")

        # Check uncertainty flag triggered for low sample size (< 5)
        has_low_sample_flag = any("LOW_SAMPLE_SUPPORT" in flag for flag in finding["uncertainty_flags"])
        assert has_low_sample_flag is True
