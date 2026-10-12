"""
Unit tests for the ingestion column mapping layer.
Tests the ColumnMap class and the ap2016-18 mapping in isolation.
No file I/O. No ML. No database.
"""

import pytest
from backend.infrastructure.ingestion.column_mapping import (
    ColumnMap,
    ColumnDefinition,
    get_column_map,
    list_datasets,
    AP2016_18_MAP,
)


class TestColumnMapBasics:
    """Tests for ColumnMap structure and lookup properties."""

    def test_ap2016_18_loads(self):
        col_map = get_column_map("ap2016-18")
        assert col_map is not None
        assert col_map.dataset_id == "ap2016-18_individual_comments"

    def test_list_datasets_includes_ap2016_18(self):
        datasets = list_datasets()
        assert "ap2016-18" in datasets

    def test_unknown_dataset_raises_key_error(self):
        with pytest.raises(KeyError, match="nonexistent_dataset"):
            get_column_map("nonexistent_dataset")

    def test_raw_to_semantic_dict_has_19_entries(self):
        col_map = get_column_map("ap2016-18")
        assert len(col_map.raw_to_semantic) == 19

    def test_semantic_to_raw_is_inverse(self):
        col_map = get_column_map("ap2016-18")
        for raw, semantic in col_map.raw_to_semantic.items():
            assert col_map.semantic_to_raw[semantic] == raw

    def test_no_duplicate_semantic_names(self):
        col_map = get_column_map("ap2016-18")
        semantics = [d.semantic_name for d in col_map.definitions]
        assert len(semantics) == len(set(semantics)), "Duplicate semantic names found"

    def test_no_duplicate_raw_names(self):
        col_map = get_column_map("ap2016-18")
        raws = [d.raw_name for d in col_map.definitions]
        assert len(raws) == len(set(raws)), "Duplicate raw names found"


class TestPrimaryTextColumns:
    """Tests for primary NLP text column identification."""

    def test_primary_text_columns_are_nonempty(self):
        col_map = get_column_map("ap2016-18")
        primary = col_map.primary_text_columns
        assert len(primary) > 0

    def test_known_primaries_included(self):
        col_map = get_column_map("ap2016-18")
        primary = col_map.primary_text_columns
        # These are the columns identified during CSV inspection as primary NLP targets
        assert "practical_idea" in primary
        assert "engagement_question" in primary
        assert "og_importance" in primary

    def test_non_text_columns_not_in_primary(self):
        col_map = get_column_map("ap2016-18")
        primary = col_map.primary_text_columns
        assert "row_id" not in primary
        assert "recommendation_score" not in primary
        assert "participation_preference_codes" not in primary


class TestValidation:
    """Tests for column validation logic."""

    def test_validation_passes_with_all_required_columns(self):
        col_map = get_column_map("ap2016-18")
        required_raws = col_map.required_columns
        errors = col_map.validate_dataframe(required_raws + ["extra_column"])
        assert errors == []

    def test_validation_fails_when_required_column_missing(self):
        col_map = get_column_map("ap2016-18")
        # Remove all required columns from the "present" list
        errors = col_map.validate_dataframe([])
        # Should have at least one error per required column
        assert len(errors) > 0
        assert any("Required column missing" in e for e in errors)

    def test_source_language_is_required(self):
        col_map = get_column_map("ap2016-18")
        required = col_map.required_columns
        # Source Language was flagged as required in the column map
        raw_source_lang = col_map.semantic_to_raw["source_language"]
        assert raw_source_lang in required


class TestColumnDefinitions:
    """Tests that specific known columns are correctly defined."""

    def test_row_id_is_id_role(self):
        defn = next(
            d for d in AP2016_18_MAP.definitions if d.semantic_name == "row_id"
        )
        assert defn.role == "id"
        assert defn.primary_text_candidate is False

    def test_practical_idea_is_primary_text(self):
        defn = next(
            d for d in AP2016_18_MAP.definitions if d.semantic_name == "practical_idea"
        )
        assert defn.role == "text"
        assert defn.primary_text_candidate is True

    def test_participation_codes_are_code_role(self):
        defn = next(
            d for d in AP2016_18_MAP.definitions
            if d.semantic_name == "participation_preference_codes"
        )
        assert defn.role == "code"
        assert defn.primary_text_candidate is False

    def test_recommendation_score_is_numeric(self):
        defn = next(
            d for d in AP2016_18_MAP.definitions
            if d.semantic_name == "recommendation_score"
        )
        assert defn.role == "numeric"


class TestOG201718QuestionnaireMap:
    """Tests for the 2017-18 Get Involved Questionnaire ColumnMap."""

    def test_og2017_18_map_loads(self):
        col_map = get_column_map("og2017-18_questionnaire")
        assert col_map is not None
        assert col_map.dataset_id == "og2017-18_questionnaire"
        assert col_map.header_row == 1

    def test_list_datasets_includes_og2017_18(self):
        datasets = list_datasets()
        assert "og2017-18_questionnaire" in datasets
        assert "og_questionnaire_2017_18" in datasets

    def test_definitions_count_is_98(self):
        col_map = get_column_map("og2017-18_questionnaire")
        assert len(col_map.definitions) == 98
        assert len(col_map.raw_to_semantic) == 98

    def test_semantic_to_raw_is_inverse(self):
        col_map = get_column_map("og2017-18_questionnaire")
        for raw, semantic in col_map.raw_to_semantic.items():
            assert col_map.semantic_to_raw[semantic] == raw

    def test_no_duplicate_semantic_or_raw_names(self):
        col_map = get_column_map("og2017-18_questionnaire")
        semantics = [d.semantic_name for d in col_map.definitions]
        assert len(semantics) == len(set(semantics)), "Duplicate semantic names found"
        raws = [d.raw_name for d in col_map.definitions]
        assert len(raws) == len(set(raws)), "Duplicate raw names found"

    def test_french_headers_populated(self):
        col_map = get_column_map("og2017-18_questionnaire")
        for d in col_map.definitions:
            assert d.raw_name_fr is not None
            assert len(d.raw_name_fr.strip()) > 0

    def test_primary_text_columns(self):
        col_map = get_column_map("og2017-18_questionnaire")
        primaries = col_map.primary_text_columns
        assert len(primaries) == 3
        assert "text_q8_missed_topics" in primaries
        assert "text_q14_satisfaction_reason" in primaries
        assert "text_q18_experience_topic" in primaries

    def test_all_open_text_columns_retained(self):
        col_map = get_column_map("og2017-18_questionnaire")
        text_cols = col_map.all_text_columns
        assert len(text_cols) == 10
        # All 10 text fields must be marked as retained in curated
        curated = col_map.curated_columns
        for tc in text_cols:
            assert tc in curated, f"Open text column {tc} not marked as retained!"

    def test_curated_columns_count(self):
        col_map = get_column_map("og2017-18_questionnaire")
        curated = col_map.curated_columns
        assert len(curated) == 24
        assert "respondent_id" in curated
        assert "language" in curated
        assert "stakeholder_sector" in curated
        assert "satisfaction_score" in curated

    def test_required_columns(self):
        col_map = get_column_map("og2017-18_questionnaire")
        required_raw = col_map.required_columns
        assert len(required_raw) >= 3
        assert "Unique Identifier" in required_raw
        assert "Language" in required_raw

