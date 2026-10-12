"""
Unit tests for DatasetCurationService.
Validates curation, column filtering, text cleaning, privacy sanitization, and audit flags.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from backend.infrastructure.ingestion.curation import DatasetCurationService

RAW_CSV_PATH = "data/raw/Open Government Consultation Data 2017-18 Get Involved Questionnaire.csv"


class TestDatasetCurationUnit:
    """Unit tests for curation logic without full file I/O."""

    def test_sanitize_city_redacts_canadian_postal_code(self):
        val = "H9W 1Y2"
        sanitized = DatasetCurationService.sanitize_city(val)
        assert sanitized == "[REDACTED_POSTAL_CODE]"

    def test_sanitize_city_redacts_postal_code_with_text(self):
        val = "Ottawa K1A 0B1"
        sanitized = DatasetCurationService.sanitize_city(val)
        assert "[REDACTED_POSTAL_CODE]" in sanitized
        assert "Ottawa" in sanitized

    def test_sanitize_city_preserves_legitimate_city_names(self):
        cities = ["Montreal", "Toronto", "Vancouver", "100 Mile House", "Québec"]
        for c in cities:
            sanitized = DatasetCurationService.sanitize_city(c)
            assert sanitized == c

    def test_sanitize_city_handles_none_and_empty(self):
        assert pd.isna(DatasetCurationService.sanitize_city(None))
        assert pd.isna(DatasetCurationService.sanitize_city(""))
        assert pd.isna(DatasetCurationService.sanitize_city("   "))


@pytest.mark.skipif(
    not Path(RAW_CSV_PATH).exists(),
    reason="Questionnaire raw CSV file not present",
)
class TestDatasetCurationIntegration:
    """Tests curation execution against real questionnaire file."""

    def setup_method(self):
        self.service = DatasetCurationService()
        self.result = self.service.curate(
            raw_file_path=RAW_CSV_PATH,
            dataset_id="og2017-18_questionnaire",
            save_to_disk=False,  # don't re-save in unit test
        )

    def test_curation_succeeds(self):
        assert self.result.ok is True, f"Curation failed: {self.result.errors}"
        assert self.result.errors == []

    def test_curated_dataframe_dimensions(self):
        df = self.result.curated_df
        assert len(df) == 8212
        assert len(df.columns) == 28  # 24 curated + source_language_raw + 3 audit flags

    def test_comments_dataframe_dimensions(self):
        df_comm = self.result.comments_df
        assert len(df_comm) == 4118
        assert df_comm["has_open_text"].all()

    def test_all_10_text_fields_present_in_curated(self):
        df = self.result.curated_df
        text_cols = [
            "text_q2r_other_transparency",
            "text_q4r_other_accountability",
            "text_q6r_other_participation",
            "text_q8_missed_topics",
            "text_q9r_other_interest",
            "text_q11r_other_involvement_activity",
            "text_q12r_other_involvement_channel",
            "text_q14_satisfaction_reason",
            "text_q18_experience_topic",
            "text_q19r_other_sector",
        ]
        for col in text_cols:
            assert col in df.columns, f"Text column {col} missing from curated df"

    def test_postal_code_redacted_in_curated_data(self):
        df = self.result.curated_df
        # Row 4050 previously contained H9W 1Y2
        row_4050_city = df.loc[4050, "city"]
        assert row_4050_city == "[REDACTED_POSTAL_CODE]"

    def test_language_standardized(self):
        df = self.result.curated_df
        langs = set(df["language"].dropna().unique())
        assert langs == {"en", "fr"}

    def test_no_duplicate_respondent_ids(self):
        df = self.result.curated_df
        assert df["respondent_id"].duplicated().sum() == 0

    def test_audit_flags_consistency(self):
        df = self.result.curated_df
        assert (df["open_text_field_count"] >= 0).all()
        assert (df["open_text_field_count"] <= 10).all()
        assert ((df["open_text_field_count"] > 0) == df["has_open_text"]).all()
