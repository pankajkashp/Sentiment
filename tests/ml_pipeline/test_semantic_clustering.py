"""
Unit and validation tests for PolicyLens Semantic Clustering Experiment.
Validates the integrity, schema, evidence preservation, and unverified notice
in all outputs of experiments/semantic_clustering/.
"""

import json
from pathlib import Path
import pandas as pd
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
EXP_DIR = PROJECT_ROOT / "experiments" / "semantic_clustering"
DATA_DIR = EXP_DIR / "dataset"
REPORTS_DIR = EXP_DIR / "reports"
CLEANED_CSV = PROJECT_ROOT / "data" / "processed" / "policylens_comments_cleaned_v1.csv"


class TestSemanticClusteringOutputs:
    """Validate existence and schema of semantic clustering outputs."""

    def test_clustered_comments_file_exists_and_valid(self):
        csv_path = DATA_DIR / "policylens_q8_clustered_comments.csv"
        assert csv_path.exists(), f"Missing file: {csv_path}"

        df = pd.read_csv(csv_path)
        assert len(df) > 2000, f"Expected >2000 comments, found {len(df)}"

        required_cols = [
            "comment_id",
            "cluster_id",
            "cluster_theme",
            "comment",
            "source_document",
            "source_url",
            "section_page",
            "stakeholder",
            "language",
            "source_question"
        ]
        for col in required_cols:
            assert col in df.columns, f"Missing required column: {col}"

        # Assert no nulls in critical identification fields
        assert df["comment_id"].notna().all(), "Found null comment_id!"
        assert df["cluster_id"].notna().all(), "Found null cluster_id!"
        assert df["comment"].notna().all(), "Found null comment text!"
        assert df["cluster_theme"].notna().all(), "Found null cluster_theme!"

    def test_verbatim_text_preservation(self):
        """Verify comments match the processed canonical dataset verbatim."""
        clustered_df = pd.read_csv(DATA_DIR / "policylens_q8_clustered_comments.csv")
        cleaned_df = pd.read_csv(CLEANED_CSV)

        # Merge on comment_id
        merged = clustered_df.merge(cleaned_df[["comment_id", "comment"]], on="comment_id", suffixes=("_clustered", "_cleaned"))
        assert len(merged) == len(clustered_df), "Merge row count mismatch"
        assert (merged["comment_clustered"] == merged["comment_cleaned"]).all(), "Comment text was modified during clustering!"

    def test_issue_summary_table_integrity(self):
        """Validate issue summary table CSV and JSON."""
        csv_path = REPORTS_DIR / "policylens_issue_summary_table.csv"
        json_path = REPORTS_DIR / "policylens_issue_summary_table.json"

        assert csv_path.exists(), f"Missing file: {csv_path}"
        assert json_path.exists(), f"Missing file: {json_path}"

        df = pd.read_csv(csv_path)
        assert len(df) >= 5, f"Expected at least 5 clusters, found {len(df)}"

        for _, row in df.iterrows():
            assert "[UNVERIFIED" in str(row["candidate_concern"]), f"Missing unverified label in concern: {row['candidate_concern']}"
            assert "[UNVERIFIED" in str(row["candidate_requested_action"]), f"Missing unverified label in action: {row['candidate_requested_action']}"
            assert row["verification_status"] == "UNVERIFIED (Awaiting Human Review)"
            assert row["cluster_size"] > 0

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert len(data) == len(df)
        for cluster in data:
            assert "evidence_metadata" in cluster
            assert len(cluster["evidence_metadata"]) > 0
            for rep in cluster["evidence_metadata"]:
                assert "comment_id" in rep
                assert "verbatim_excerpt" in rep
                assert "source_url" in rep
                assert rep["source_url"].startswith("http")

    def test_pilot_annotation_batch_schema_and_blanks(self):
        """Ensure pilot batch has exactly 50 rows and annotation target fields."""
        batch_path = DATA_DIR / "policylens_pilot_annotation_batch_50.csv"
        assert batch_path.exists(), f"Missing file: {batch_path}"

        df = pd.read_csv(batch_path)
        assert len(df) == 50, f"Expected exactly 50 rows in pilot batch, found {len(df)}"

        # Verify annotation target fields are present
        for target_col in ["topic", "stance", "concern", "demand"]:
            assert target_col in df.columns, f"Missing annotation field: {target_col}"

    def test_human_annotation_worksheet_integrity(self):
        """Verify human annotation worksheet exists and preserves verbatim comment text."""
        worksheet_path = DATA_DIR / "human_annotation_worksheet_50.csv"
        assert worksheet_path.exists(), f"Missing file: {worksheet_path}"

        df = pd.read_csv(worksheet_path)
        assert len(df) == 50, f"Expected 50 rows, found {len(df)}"

        required_cols = ["comment_id", "cluster_id", "comment", "topic", "stance", "concern", "demand", "annotator_id", "notes"]
        for c in required_cols:
            assert c in df.columns, f"Missing column: {c}"

        # Target fields must be empty
        for c in ["topic", "stance", "concern", "demand", "annotator_id", "notes"]:
            assert df[c].isna().all(), f"Field '{c}' should be blank for human coders"

        # Verify comments match pilot batch verbatim
        pilot_df = pd.read_csv(DATA_DIR / "policylens_pilot_annotation_batch_50.csv")
        assert (df["comment"] == pilot_df["comment"]).all(), "Comment text was modified in worksheet!"

    def test_cluster_review_worksheet_integrity(self):
        """Verify cluster review worksheet has 9 clusters and evaluation fields."""
        csv_path = REPORTS_DIR / "cluster_review_worksheet.csv"
        md_path = REPORTS_DIR / "cluster_review_worksheet.md"
        assert csv_path.exists(), f"Missing file: {csv_path}"
        assert md_path.exists(), f"Missing file: {md_path}"

        df = pd.read_csv(csv_path)
        assert len(df) == 9, f"Expected 9 clusters, found {len(df)}"

        required_review_cols = [
            "cluster_id", "candidate_theme", "cluster_size", "top_keywords",
            "representative_comments_verbatim", "is_theme_coherent",
            "intrusions_unrelated_comments", "cross_cluster_overlaps",
            "recommended_human_theme", "reviewer_decision"
        ]
        for c in required_review_cols:
            assert c in df.columns, f"Missing review column: {c}"

        # Evaluator fields must be initially blank
        for c in ["is_theme_coherent", "intrusions_unrelated_comments", "cross_cluster_overlaps", "recommended_human_theme", "reviewer_decision"]:
            assert df[c].isna().all(), f"Reviewer column '{c}' should be blank"

    def test_concise_annotation_guide_exists(self):
        """Verify concise annotation guide exists and documents key rules."""
        guide_path = REPORTS_DIR / "concise_annotation_guide.md"
        assert guide_path.exists(), f"Missing file: {guide_path}"
        content = guide_path.read_text(encoding="utf-8")
        assert "Unclear or Incoherent Comments" in content
        assert "Mixed Stances" in content
        assert "Comments with a Concern but No Specific Demand" in content
        assert "Comments with a Demand but No Explicit Complaint" in content

    def test_evidence_package_artifacts(self):
        """Verify research paper evidence package outputs."""
        evidence_csv = EXP_DIR / "evidence_examples.csv"
        results_json = EXP_DIR / "results.json"
        paper_summary = EXP_DIR / "paper_summary.md"

        assert evidence_csv.exists(), "Missing evidence_examples.csv"
        assert results_json.exists(), "Missing results.json"
        assert paper_summary.exists(), "Missing paper_summary.md"

        ev_df = pd.read_csv(evidence_csv)
        assert len(ev_df) >= 9, "Expected at least 1 example per cluster"
        assert "comment_verbatim" in ev_df.columns
        assert "candidate_concern" in ev_df.columns
        assert "candidate_requested_action" in ev_df.columns

        with open(results_json) as f:
            res = json.load(f)
        assert "selected_k" in res["model_configuration"]
        assert "silhouette_scores" in res["model_configuration"]
        assert "cluster_distribution" in res

        # Verify publication figures exist
        for fig in ["silhouette_scores.png", "cluster_size_distribution.png", "cluster_pca_projection.png", "cluster_stakeholder_distribution.png"]:
            fig_path = EXP_DIR / "figures" / fig
            assert fig_path.exists(), f"Missing figure: {fig}"

    def test_evaluate_annotations_dry_run(self):
        """Verify evaluate_annotations.py dry-run fixture calculates all metrics."""
        from experiments.semantic_clustering.evaluate_annotations import create_dry_run_fixture, evaluate_dataframe
        fixture_df = create_dry_run_fixture()
        results = evaluate_dataframe(fixture_df)

        assert results["status"] == "COMPLETED_EVALUATION"
        assert results["completion_status"]["is_fully_annotated"] is True
        assert "cluster_purity" in results["topic_clustering_evaluation"]
        assert "adjusted_rand_index" in results["topic_clustering_evaluation"]
        assert "normalized_mutual_info" in results["topic_clustering_evaluation"]
        assert "model_accuracy" in results["stance_evaluation"]
        assert "model_macro_f1" in results["stance_evaluation"]
        assert "cohen_kappa" in results["stance_evaluation"]
        assert "blank_demand_agreement_rate" in results["concern_demand_extraction_evaluation"]

