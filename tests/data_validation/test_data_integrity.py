"""
Data validation tests — leakage, duplicates, split contamination.
These tests run against real processed data files when present.
They serve as regression guards for data pipeline integrity.
"""

import pytest
from pathlib import Path

import pandas as pd


REAL_CSV_PATH = "data/raw/ap2016-18_individual_comments.csv"
REAL_ENCODING = "Windows-1252"


@pytest.mark.skipif(
    not Path(REAL_CSV_PATH).exists(),
    reason="Real CSV file not present",
)
class TestRawDataIntegrity:
    """Validate raw CSV properties that must be stable."""

    def setup_method(self):
        self.df = pd.read_csv(REAL_CSV_PATH, encoding=REAL_ENCODING, low_memory=False)

    def test_expected_row_count(self):
        """Row count must be 160. Any deviation requires investigation."""
        assert len(self.df) == 160, (
            f"Expected 160 rows, got {len(self.df)}. "
            "If the file was updated, update this test and the metadata."
        )

    def test_expected_column_count(self):
        assert len(self.df.columns) == 19, (
            f"Expected 19 columns, got {len(self.df.columns)}."
        )

    def test_row_id_has_no_duplicates_among_non_null(self):
        row_ids = self.df.iloc[:, 0].dropna()
        assert row_ids.duplicated().sum() == 0, "Duplicate row IDs found in non-null values"

    def test_source_language_no_unexpected_values(self):
        """Known anomaly: 'S' value. This test documents it explicitly."""
        col = self.df["Source Language"]
        known_values = {"English", "French", "Anglais", "Français"}
        anomalous = col.dropna()[~col.dropna().isin(known_values)]
        # We KNOW about the 'S' value — document it, don't silently pass
        anomalous_vals = anomalous.unique().tolist()
        assert anomalous_vals == ["S"], (
            f"Unexpected source language anomalies: {anomalous_vals}. "
            "Update this test if the dataset has been cleaned."
        )

    def test_full_duplicate_rows_count(self):
        """13 fully duplicate rows are known. This test tracks them."""
        n_dups = self.df.duplicated().sum()
        assert n_dups == 13, (
            f"Expected 13 fully duplicate rows, found {n_dups}. "
            "If the file changed, re-run data quality report and update metadata."
        )

    def test_text_columns_not_all_null(self):
        """Primary text columns must not be entirely null."""
        text_cols = [
            "1 Practical idea (Also in Compilation)\nUne idée pratique (Toujours dans Compilation)",
            "Public Engagement Question (Also in Compilation)\nQuestion sur la mobilisation du ",
            "OG is important because\nIl est important d\u2019avoir un gouvernement ouvert parce que ",
        ]
        for col in text_cols:
            assert col in self.df.columns, f"Column not found: {repr(col)}"
            n_nonnull = self.df[col].notna().sum()
            assert n_nonnull > 0, f"Column is entirely null: {repr(col)}"

    def test_recommendation_score_range(self):
        """Numeric score column must be in the valid range 0–10."""
        score_col = "Would you recommend?\nRecommanderiez-vous "
        scores = self.df[score_col].dropna()
        assert (scores >= 0).all() and (scores <= 10).all(), (
            f"Recommendation scores out of range [0,10]: {scores[~((scores >= 0) & (scores <= 10))].tolist()}"
        )


class TestSplitLeakagePrevention:
    """
    Tests to be run after train/validation/test splits are created.
    Currently these are stubs — they will fail intentionally until splits exist.
    They serve as a reminder and enforcement point.
    """

    TRAIN_PATH = "data/processed/train.csv"
    VALIDATION_PATH = "data/processed/validation.csv"
    TEST_PATH = "data/processed/test.csv"

    @pytest.mark.skip(reason="Splits not yet created — run after data splitting step")
    def test_no_comment_id_overlap_train_test(self):
        train = pd.read_csv(self.TRAIN_PATH)
        test = pd.read_csv(self.TEST_PATH)
        overlap = set(train["comment_id"]) & set(test["comment_id"])
        assert len(overlap) == 0, f"Data leakage: {len(overlap)} comment IDs in both train and test"

    @pytest.mark.skip(reason="Splits not yet created — run after data splitting step")
    def test_no_comment_id_overlap_train_validation(self):
        train = pd.read_csv(self.TRAIN_PATH)
        val = pd.read_csv(self.VALIDATION_PATH)
        overlap = set(train["comment_id"]) & set(val["comment_id"])
        assert len(overlap) == 0, f"Data leakage: {len(overlap)} comment IDs in both train and validation"

    @pytest.mark.skip(reason="Splits not yet created — run after data splitting step")
    def test_no_comment_id_overlap_validation_test(self):
        val = pd.read_csv(self.VALIDATION_PATH)
        test = pd.read_csv(self.TEST_PATH)
        overlap = set(val["comment_id"]) & set(test["comment_id"])
        assert len(overlap) == 0, f"Data leakage: {len(overlap)} comment IDs in both validation and test"

    @pytest.mark.skip(reason="Splits not yet created — run after data splitting step")
    def test_no_text_duplicates_across_train_test(self):
        """Detects near-identical text leakage even if IDs differ."""
        train = pd.read_csv(self.TRAIN_PATH)
        test = pd.read_csv(self.TEST_PATH)
        train_texts = set(train["original_text"].str.strip().str.lower().dropna())
        test_texts = set(test["original_text"].str.strip().str.lower().dropna())
        overlap = train_texts & test_texts
        assert len(overlap) == 0, (
            f"Potential text leakage: {len(overlap)} identical texts appear in both train and test."
        )
