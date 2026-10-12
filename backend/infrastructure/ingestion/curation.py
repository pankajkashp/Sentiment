"""
PolicyLens — Dataset Curation Service
======================================
Transforms raw, ingested consultation questionnaire data into clean,
standardized, and privacy-protected curated datasets stored in `data/processed/`.

Design principles:
- Strictly reproducible and deterministic.
- Never invents missing values, labels, or synthetic data (RESEARCH_RULES R2, R3).
- Preserves raw source files completely immutable (RESEARCH_RULES R10).
- Applies privacy risk redactions (e.g., postal codes in free-text location fields).
- Retains all potentially useful open text without discarding signals.
- Standardizes empty strings to nulls and trims extraneous whitespace.
- Computes audit flags for downstream NLP filtering without data distortion.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from backend.infrastructure.ingestion.column_mapping import (
    ColumnMap,
    get_column_map,
)
from backend.infrastructure.ingestion.csv_loader import CSVIngestionService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Privacy Regexes
# ---------------------------------------------------------------------------

# Canadian Postal Code pattern (e.g. H9W 1Y2, K1A 0B1)
CANADIAN_POSTAL_RE = re.compile(
    r"\b[A-CEGHJ-NPRSTVXY]\d[A-CEGHJ-NPRSTV-Z][ -]?\d[A-CEGHJ-NPRSTV-Z]\d\b",
    re.IGNORECASE,
)

# International PIN / Postal numbers in full address lines
FOREIGN_POSTAL_RE = re.compile(r"\b\d{5,6}\b")
FOREIGN_POSTAL_CONTEXT_KEYWORDS = ("pin", "distt", "p.o", "lavis", "punjab", "village", "box")


@dataclass
class CurationResult:
    """Result object returned by DatasetCurationService."""
    ok: bool
    curated_df: Optional[pd.DataFrame] = None
    comments_df: Optional[pd.DataFrame] = None
    curated_file_path: Optional[str] = None
    comments_file_path: Optional[str] = None
    metadata_file_path: Optional[str] = None
    stats: Dict[str, object] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class DatasetCurationService:
    """
    Curates raw consultation datasets into structured, privacy-safe processed datasets.
    """

    def __init__(self, ingestion_service: Optional[CSVIngestionService] = None):
        self.ingestion_service = ingestion_service or CSVIngestionService()

    @staticmethod
    def sanitize_city(val: object) -> object:
        """
        Redacts postal codes and specific address PINs from free-text city entries.
        Preserves genuine city/town names (e.g., '100 Mile House', 'Montreal').
        """
        if not isinstance(val, str) or not val.strip():
            return np.nan
        v = val.strip()

        # Check Canadian Postal Code
        if CANADIAN_POSTAL_RE.search(v):
            v = CANADIAN_POSTAL_RE.sub("[REDACTED_POSTAL_CODE]", v)

        # Check foreign PIN / postal numbers embedded in address lines
        if FOREIGN_POSTAL_RE.search(v):
            v_lower = v.lower()
            if any(kw in v_lower for kw in FOREIGN_POSTAL_CONTEXT_KEYWORDS):
                v = FOREIGN_POSTAL_RE.sub("[REDACTED_POSTAL_CODE]", v)

        return v

    def curate(
        self,
        raw_file_path: str | Path,
        dataset_id: str = "og2017-18_questionnaire",
        version: str = "1.0.0",
        output_dir: str | Path = "data/processed",
        save_to_disk: bool = True,
    ) -> CurationResult:
        """
        Loads raw CSV, retains curated columns, cleans text, redacts PII risks,
        computes audit flags, and writes curated datasets to disk.
        """
        result = CurationResult(ok=False)
        raw_path = Path(raw_file_path)
        out_dir = Path(output_dir)

        # 1. Ingest raw CSV
        ingest_res = self.ingestion_service.load(raw_path, dataset_id=dataset_id)
        if not ingest_res.ok:
            result.errors.extend(ingest_res.errors)
            return result
        df = ingest_res.data.copy()

        # 2. Get Column Map
        try:
            col_map = get_column_map(dataset_id)
        except KeyError as e:
            result.errors.append(str(e))
            return result

        curated_cols = col_map.curated_columns
        if not curated_cols:
            result.errors.append(f"No curated columns defined for dataset '{dataset_id}'")
            return result

        # Ensure all requested curated columns exist
        missing_curated = [c for c in curated_cols if c not in df.columns]
        if missing_curated:
            result.errors.append(f"Curated columns missing in loaded data: {missing_curated}")
            return result

        # 3. Retain relevant columns
        df_curated = df[curated_cols].copy()

        # 4. Normalize language
        if "language" in df_curated.columns:
            source_lang_raw = df_curated["language"].copy()
            df_curated["source_language_raw"] = source_lang_raw
            df_curated["language"] = source_lang_raw.apply(
                lambda x: "en" if "English" in str(x) else ("fr" if ("French" in str(x) or "français" in str(x)) else str(x))
            )

        # 5. Clean open-text fields
        text_cols = [c for c in curated_cols if c.startswith("text_")]
        for c in text_cols:
            df_curated[c] = df_curated[c].replace("", np.nan)
            df_curated[c] = df_curated[c].apply(lambda x: x.strip() if isinstance(x, str) else x)
            df_curated[c] = df_curated[c].replace("", np.nan)

        # 6. Sanitize privacy risks in location metadata
        if "city" in df_curated.columns:
            df_curated["city"] = df_curated["city"].apply(self.sanitize_city)

        # Clean string whitespace in demographic metadata
        for meta_col in ["stakeholder_sector", "country", "province"]:
            if meta_col in df_curated.columns:
                df_curated[meta_col] = df_curated[meta_col].apply(
                    lambda x: x.strip() if isinstance(x, str) else x
                )
                df_curated[meta_col] = df_curated[meta_col].replace("", np.nan)

        # 7. Compute reproducible audit flags (no data hallucination)
        has_text_mask = df_curated[text_cols].notna().any(axis=1)
        text_count_series = df_curated[text_cols].notna().sum(axis=1)

        primary_text_cols = [c for c in col_map.primary_text_columns if c in df_curated.columns]
        if primary_text_cols:
            primary_chars = (
                df_curated[primary_text_cols]
                .fillna("")
                .map(len)
                .sum(axis=1)
            )
        else:
            primary_chars = pd.Series([0] * len(df_curated), index=df_curated.index)

        df_curated["has_open_text"] = has_text_mask
        df_curated["open_text_field_count"] = text_count_series
        df_curated["primary_text_char_count"] = primary_chars

        # 8. Create comments-only subset (rows with at least one text field)
        df_comments = df_curated[has_text_mask].copy()

        # 9. Compute stats
        stats = {
            "dataset_id": dataset_id,
            "version": version,
            "total_rows": len(df_curated),
            "total_columns": len(df_curated.columns),
            "rows_with_open_text": int(has_text_mask.sum()),
            "rows_without_open_text": int((~has_text_mask).sum()),
            "open_text_coverage_pct": round(float(has_text_mask.mean() * 100), 2),
            "comments_subset_rows": len(df_comments),
            "text_columns": text_cols,
            "primary_text_columns": primary_text_cols,
            "text_counts_per_column": {
                c: int(df_curated[c].notna().sum()) for c in text_cols
            },
        }

        # 10. Save to disk if requested
        if save_to_disk:
            out_dir.mkdir(parents=True, exist_ok=True)
            curated_filename = f"og2017_18_questionnaire_curated_v{version}.csv"
            comments_filename = f"og2017_18_questionnaire_comments_v{version}.csv"
            meta_filename = f"metadata_og2017_18_questionnaire_curated_v{version}.json"

            curated_path = out_dir / curated_filename
            comments_path = out_dir / comments_filename
            meta_path = out_dir / meta_filename

            df_curated.to_csv(curated_path, index=False, encoding="utf-8")
            df_comments.to_csv(comments_path, index=False, encoding="utf-8")

            # Compute sha256 hashes
            import hashlib
            def compute_sha256(p: Path) -> str:
                sha = hashlib.sha256()
                with open(p, "rb") as f:
                    while chunk := f.read(65536):
                        sha.update(chunk)
                return sha.hexdigest()

            metadata = {
                "dataset_id": dataset_id,
                "version": version,
                "created_from_raw": str(raw_path),
                "raw_file_sha256": compute_sha256(raw_path),
                "curated_csv": str(curated_path),
                "curated_csv_sha256": compute_sha256(curated_path),
                "comments_csv": str(comments_path),
                "comments_csv_sha256": compute_sha256(comments_path),
                "encoding": "utf-8",
                "stats": stats,
                "columns": [
                    {
                        "name": col,
                        "dtype": str(df_curated[col].dtype),
                        "null_count": int(df_curated[col].isnull().sum()),
                        "unique_count": int(df_curated[col].nunique(dropna=True)),
                    }
                    for col in df_curated.columns
                ],
            }
            meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")

            result.curated_file_path = str(curated_path)
            result.comments_file_path = str(comments_path)
            result.metadata_file_path = str(meta_path)
            logger.info("Saved curated dataset to %s and %s", curated_path, comments_path)

        result.ok = True
        result.curated_df = df_curated
        result.comments_df = df_comments
        result.stats = stats
        return result
