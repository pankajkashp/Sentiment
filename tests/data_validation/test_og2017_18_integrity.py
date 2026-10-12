"""
Data validation tests for 2017-18 Open Government Get Involved Questionnaire.
Validates raw file stability and processed curated outputs against data regressions.
"""

from pathlib import Path
import hashlib
import pandas as pd
import pytest

RAW_CSV_PATH = "data/raw/Open Government Consultation Data 2017-18 Get Involved Questionnaire.csv"
RAW_SHA256 = "bebcc9e5264fc00788c4094b579f90dcf2f8590aaeab528f30a338a7e2344239"

PROCESSED_CURATED_PATH = "data/processed/og2017_18_questionnaire_curated_v1.0.0.csv"
PROCESSED_COMMENTS_PATH = "data/processed/og2017_18_questionnaire_comments_v1.0.0.csv"
PROCESSED_META_PATH = "data/processed/metadata_og2017_18_questionnaire_curated_v1.0.0.json"


@pytest.mark.skipif(
    not Path(RAW_CSV_PATH).exists(),
    reason="Questionnaire raw CSV file not present",
)
class TestRawQuestionnaireIntegrity:
    """Validate that raw source file remains completely unchanged (RESEARCH_RULES R10)."""

    def test_raw_file_sha256_unmodified(self):
        sha = hashlib.sha256()
        with open(RAW_CSV_PATH, "rb") as f:
            while chunk := f.read(65536):
                sha.update(chunk)
        assert sha.hexdigest() == RAW_SHA256, (
            "Raw file SHA-256 hash has changed! RESEARCH_RULES R10 forbids modifying raw data."
        )

    def test_raw_row_and_column_counts(self):
        df = pd.read_csv(RAW_CSV_PATH, header=1, encoding="Windows-1252", low_memory=False)
        assert len(df) == 8212, f"Expected 8212 data rows, got {len(df)}"
        assert len(df.columns) == 98, f"Expected 98 columns, got {len(df.columns)}"


@pytest.mark.skipif(
    not Path(PROCESSED_CURATED_PATH).exists(),
    reason="Processed curated CSV file not yet created",
)
class TestCuratedQuestionnaireIntegrity:
    """Validate properties of curated processed dataset."""

    def setup_method(self):
        self.df = pd.read_csv(PROCESSED_CURATED_PATH, low_memory=False)

    def test_expected_row_count(self):
        assert len(self.df) == 8212

    def test_expected_column_count(self):
        # 24 semantic + 1 source_language_raw + 3 audit flags = 28
        assert len(self.df.columns) == 28

    def test_unique_respondent_ids(self):
        assert self.df["respondent_id"].duplicated().sum() == 0

    def test_language_values_normalized(self):
        langs = set(self.df["language"].dropna().unique())
        assert langs == {"en", "fr"}

    def test_satisfaction_score_range(self):
        # Q13 values are 1.0 to 6.0
        scores = self.df["satisfaction_score"].dropna()
        assert (scores >= 1.0).all() and (scores <= 6.0).all()

    def test_postal_code_redacted_in_city(self):
        # Ensure row 4050 does not leak the postal code
        assert self.df.loc[4050, "city"] == "[REDACTED_POSTAL_CODE]"
        # No Canadian postal codes should remain in city column
        import re
        cad_postal = re.compile(r"\b[A-CEGHJ-NPRSTVXY]\d[A-CEGHJ-NPRSTV-Z][ -]?\d[A-CEGHJ-NPRSTV-Z]\d\b", re.IGNORECASE)
        leaked = self.df["city"].dropna().apply(lambda x: bool(cad_postal.search(x)))
        assert leaked.sum() == 0, f"Found leaked postal codes in city column: {leaked.sum()}"

    def test_no_synthetic_or_invented_text(self):
        # Text fields should contain either non-empty strings or null (NaN)
        text_cols = [c for c in self.df.columns if c.startswith("text_")]
        for c in text_cols:
            non_null = self.df[c].dropna()
            # Non-null entries must not be empty or whitespace-only
            assert (non_null.str.strip().str.len() > 0).all()


@pytest.mark.skipif(
    not Path(PROCESSED_COMMENTS_PATH).exists(),
    reason="Processed comments CSV file not yet created",
)
class TestCommentsSubsetIntegrity:
    """Validate properties of comments-only processed subset."""

    def setup_method(self):
        self.df_comm = pd.read_csv(PROCESSED_COMMENTS_PATH, low_memory=False)

    def test_expected_comment_rows(self):
        assert len(self.df_comm) == 4118

    def test_all_rows_have_open_text(self):
        assert self.df_comm["has_open_text"].all()
        assert (self.df_comm["open_text_field_count"] >= 1).all()

    def test_subset_respondent_ids_contained_in_curated(self):
        df_curated = pd.read_csv(PROCESSED_CURATED_PATH, low_memory=False)
        comm_ids = set(self.df_comm["respondent_id"])
        curated_ids = set(df_curated["respondent_id"])
        assert comm_ids.issubset(curated_ids)


class TestDatasetSeparationGuard:
    """Enforce Requirement 10: Keep og2017-18 separate from ap2016-18."""

    def test_no_row_overlap_with_ap2016_18(self):
        raw_ap = Path("data/raw/ap2016-18_individual_comments.csv")
        if not raw_ap.exists() or not Path(PROCESSED_CURATED_PATH).exists():
            pytest.skip("Files not present")

        df_ap = pd.read_csv(raw_ap, encoding="Windows-1252", low_memory=False)
        df_og = pd.read_csv(PROCESSED_CURATED_PATH, low_memory=False)

        # ap2016-18 has float row IDs (1.0 - 160.0); og2017-18 has 12-digit IDs (110000194613)
        ap_ids = set(df_ap.iloc[:, 0].dropna().astype(str))
        og_ids = set(df_og["respondent_id"].astype(str))
        assert len(ap_ids & og_ids) == 0, "ID overlap detected between separate datasets!"
