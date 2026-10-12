"""
Unit tests for CSVIngestionService.
Tests validation, error handling, and column renaming.
Some tests use the real CSV file (integration-style unit tests).
File-independent tests use in-memory mocks.
"""

import io
import pytest
import tempfile
import os
from pathlib import Path

import pandas as pd

from backend.infrastructure.ingestion.csv_loader import CSVIngestionService, IngestionResult


REAL_CSV_PATH = "data/raw/ap2016-18_individual_comments.csv"


class TestIngestionResultType:
    """Tests for the IngestionResult dataclass."""

    def test_default_is_not_ok(self):
        result = IngestionResult(ok=False)
        assert result.ok is False
        assert result.data is None
        assert result.errors == []
        assert result.warnings == []

    def test_add_error_populates_errors(self):
        result = IngestionResult(ok=False)
        result.add_error("something went wrong")
        assert len(result.errors) == 1
        assert "something went wrong" in result.errors[0]

    def test_add_warning_populates_warnings(self):
        result = IngestionResult(ok=False)
        result.add_warning("minor issue")
        assert len(result.warnings) == 1


class TestCSVIngestionServiceErrors:
    """Tests for file-level validation errors."""

    def setup_method(self):
        self.service = CSVIngestionService()

    def test_nonexistent_file_returns_error(self):
        result = self.service.load("/nonexistent/path/file.csv", dataset_id="ap2016-18")
        assert result.ok is False
        assert any("does not exist" in e for e in result.errors)

    def test_directory_path_returns_error(self, tmp_path):
        result = self.service.load(str(tmp_path), dataset_id="ap2016-18")
        assert result.ok is False
        assert any("not a file" in e for e in result.errors)

    def test_non_csv_extension_returns_error(self, tmp_path):
        f = tmp_path / "data.json"
        f.write_text('{"key": "value"}')
        result = self.service.load(str(f), dataset_id="ap2016-18")
        assert result.ok is False
        assert any(".csv" in e for e in result.errors)

    def test_empty_csv_returns_error(self, tmp_path):
        f = tmp_path / "empty.csv"
        f.write_text("")
        result = self.service.load(str(f), dataset_id="ap2016-18")
        assert result.ok is False
        assert any("empty" in e.lower() for e in result.errors)

    def test_unknown_dataset_id_returns_error(self, tmp_path):
        f = tmp_path / "data.csv"
        f.write_text("col1,col2\n1,2\n")
        result = self.service.load(str(f), dataset_id="NONEXISTENT_DATASET")
        assert result.ok is False
        assert any("NONEXISTENT_DATASET" in e for e in result.errors)

    def test_missing_required_column_returns_error(self, tmp_path):
        # Write CSV with completely wrong columns
        f = tmp_path / "wrong.csv"
        f.write_text("foo,bar\n1,2\n")
        result = self.service.load(
            str(f), dataset_id="ap2016-18",
        )
        assert result.ok is False
        assert any("Required column missing" in e for e in result.errors)

    def test_malformed_csv_returns_error(self, tmp_path):
        # A file with content that pandas cannot parse as valid CSV
        # (null bytes cause parse errors in some versions)
        f = tmp_path / "bad.csv"
        f.write_bytes(b"col1,col2\n\x00\x00\x00\n")
        result = self.service.load(str(f), dataset_id="ap2016-18")
        # Either parse error or missing required columns — both are failures
        assert result.ok is False


@pytest.mark.skipif(
    not Path(REAL_CSV_PATH).exists(),
    reason="Real CSV file not present — skipping real-file ingestion tests",
)
class TestCSVIngestionServiceRealFile:
    """Integration-style tests using the actual CSV file."""

    def setup_method(self):
        self.service = CSVIngestionService()
        self.result = self.service.load(REAL_CSV_PATH, dataset_id="ap2016-18")

    def test_load_succeeds(self):
        assert self.result.ok is True, f"Ingestion failed: {self.result.errors}"

    def test_no_errors_on_real_file(self):
        assert self.result.errors == []

    def test_row_count_is_160(self):
        assert len(self.result.data) == 160

    def test_column_count_is_19(self):
        assert len(self.result.data.columns) == 19

    def test_raw_column_names_not_in_dataframe(self):
        df = self.result.data
        # Raw headers contain newlines — none should survive renaming
        for col in df.columns:
            assert "\n" not in col, f"Raw column name leaked: {repr(col)}"

    def test_semantic_names_present(self):
        df = self.result.data
        expected_semantic = [
            "row_id",
            "event_name_en",
            "source_language",
            "stakeholder_sector_en",
            "practical_idea",
            "engagement_question",
            "og_importance",
            "recommendation_score",
        ]
        for col in expected_semantic:
            assert col in df.columns, f"Expected semantic column missing: {col}"

    def test_duplicate_warning_present(self):
        # We know from inspection that 13 duplicate rows exist
        assert any("duplicate" in w.lower() for w in self.result.warnings)

    def test_stats_populated(self):
        stats = self.result.stats
        assert "rows" in stats
        assert stats["rows"] == 160
        assert "full_duplicate_rows" in stats
        assert stats["full_duplicate_rows"] == 13

    def test_source_language_anomaly_warned(self):
        # 'S' value in source_language should trigger a warning
        assert any("source_language" in w for w in self.result.warnings)

    def test_max_rows_limits_output(self):
        result = self.service.load(REAL_CSV_PATH, dataset_id="ap2016-18", max_rows=10)
        assert result.ok is True
        assert len(result.data) == 10


QUESTIONNAIRE_CSV_PATH = "data/raw/Open Government Consultation Data 2017-18 Get Involved Questionnaire.csv"


@pytest.mark.skipif(
    not Path(QUESTIONNAIRE_CSV_PATH).exists(),
    reason="Questionnaire raw CSV file not present",
)
class TestCSVIngestionServiceQuestionnaire:
    """Tests loading the 2017-18 Get Involved Questionnaire using CSVIngestionService."""

    def setup_method(self):
        self.service = CSVIngestionService()
        self.result = self.service.load(QUESTIONNAIRE_CSV_PATH, dataset_id="og2017-18_questionnaire")

    def test_load_succeeds(self):
        assert self.result.ok is True, f"Ingestion failed: {self.result.errors}"
        assert self.result.errors == []

    def test_row_count_is_8212(self):
        assert len(self.result.data) == 8212

    def test_column_count_is_98(self):
        assert len(self.result.data.columns) == 98

    def test_semantic_names_mapped(self):
        df = self.result.data
        assert "respondent_id" in df.columns
        assert "language" in df.columns
        assert "text_q8_missed_topics" in df.columns
        assert "text_q14_satisfaction_reason" in df.columns
        assert "text_q18_experience_topic" in df.columns
        assert "stakeholder_sector" in df.columns

    def test_no_full_duplicate_rows(self):
        assert self.result.stats["full_duplicate_rows"] == 0

    def test_max_rows_limits_output(self):
        res = self.service.load(QUESTIONNAIRE_CSV_PATH, dataset_id="og2017-18_questionnaire", max_rows=15)
        assert res.ok is True
        assert len(res.data) == 15

