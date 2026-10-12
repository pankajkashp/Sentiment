"""
PolicyLens — CSV Ingestion Service
====================================
Responsible for loading raw CSV files into a validated, normalized
pandas DataFrame using a ColumnMap.

Design principles:
- This module ONLY loads and validates. No ML. No preprocessing.
- Never modifies the source file.
- Returns typed result objects (not exceptions-as-control-flow).
- Streaming/chunked reading prepared for future large-file support.
- All column normalisation delegated to ColumnMap.

Usage:
    from backend.infrastructure.ingestion.csv_loader import CSVIngestionService
    service = CSVIngestionService()
    result = service.load("data/raw/ap2016-18_individual_comments.csv", dataset_id="ap2016-18")
    if result.ok:
        df = result.data
    else:
        print(result.errors)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import pandas as pd

from backend.infrastructure.ingestion.column_mapping import (
    ColumnMap,
    get_column_map,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Result type — explicit success/failure, no thrown exceptions for valid cases
# ---------------------------------------------------------------------------

@dataclass
class IngestionResult:
    """Typed result returned by CSVIngestionService."""
    ok: bool
    data: Optional[pd.DataFrame] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    stats: dict = field(default_factory=dict)

    def add_warning(self, msg: str) -> None:
        logger.warning(msg)
        self.warnings.append(msg)

    def add_error(self, msg: str) -> None:
        logger.error(msg)
        self.errors.append(msg)


# ---------------------------------------------------------------------------
# Ingestion service
# ---------------------------------------------------------------------------

class CSVIngestionService:
    """
    Loads and validates a raw CSV file using a registered ColumnMap.

    This class is the ONLY entry point for loading raw CSV data into the system.
    It does not write to disk. It does not transform data beyond column renaming
    and minimal type coercion needed for downstream validation.
    """

    # Bytes to sample for encoding detection
    ENCODING_SAMPLE_BYTES: int = 100_000

    def load(
        self,
        file_path: str | Path,
        dataset_id: str,
        max_rows: Optional[int] = None,
    ) -> IngestionResult:
        """
        Load a CSV file and return a validated IngestionResult.

        Args:
            file_path:   Absolute or relative path to the raw CSV file.
            dataset_id:  Registered dataset ID used to look up ColumnMap.
            max_rows:    Optional row limit (useful for smoke-testing).

        Returns:
            IngestionResult with .ok, .data, .errors, .warnings, .stats.
        """
        result = IngestionResult(ok=False)
        path = Path(file_path)

        # --- 1. File existence and safety checks ---
        if not path.exists():
            result.add_error(f"File does not exist: {path}")
            return result

        if not path.is_file():
            result.add_error(f"Path is not a file: {path}")
            return result

        suffix = path.suffix.lower()
        if suffix != ".csv":
            result.add_error(
                f"Expected a .csv file, got '{suffix}'. "
                "Only CSV files are accepted by this loader."
            )
            return result

        # --- 2. Look up column map ---
        try:
            col_map: ColumnMap = get_column_map(dataset_id)
        except KeyError as e:
            result.add_error(str(e))
            return result

        # --- 3. Load CSV ---
        try:
            nrows = max_rows if max_rows is not None else None
            header_row = getattr(col_map, "header_row", 0)
            df = pd.read_csv(
                path,
                encoding=col_map.encoding,
                header=header_row,
                low_memory=False,
                nrows=nrows,
            )
            logger.info(
                "Loaded CSV '%s': %d rows × %d columns",
                path.name,
                len(df),
                len(df.columns),
            )
        except UnicodeDecodeError as e:
            result.add_error(
                f"Encoding error reading '{path}' with encoding '{col_map.encoding}': {e}"
            )
            return result
        except pd.errors.EmptyDataError:
            result.add_error(f"CSV file is empty: {path}")
            return result
        except pd.errors.ParserError as e:
            result.add_error(f"CSV parse error in '{path}': {e}")
            return result
        except OSError as e:
            result.add_error(f"OS error reading '{path}': {e}")
            return result

        # --- 4. Column validation ---
        validation_errors = col_map.validate_dataframe(list(df.columns))
        for err in validation_errors:
            result.add_error(err)
        if validation_errors:
            return result

        # --- 5. Column renaming ---
        # Only rename columns that exist in the map — extra columns are preserved.
        existing_raw = {k: v for k, v in col_map.raw_to_semantic.items() if k in df.columns}
        df = df.rename(columns=existing_raw)

        # Warn about raw column names that could not be mapped
        mapped_raws = set(col_map.raw_to_semantic.keys())
        actual_raws = set(col_map.raw_to_semantic.keys()) & set(
            col_map.raw_to_semantic.keys()
        )
        for raw_col in mapped_raws:
            if raw_col not in (set(df.columns) | set(existing_raw.keys())):
                result.add_warning(
                    f"Expected column not found in CSV (non-required): {repr(raw_col)}"
                )

        # --- 6. Duplicate detection ---
        n_full_duplicates = int(df.duplicated().sum())
        if n_full_duplicates > 0:
            result.add_warning(
                f"Found {n_full_duplicates} fully duplicate rows. "
                "These are NOT removed here — caller must decide deduplication strategy."
            )

        # --- 7. Known data anomalies —warnings only ---
        lang_col = "source_language" if "source_language" in df.columns else ("language" if "language" in df.columns else None)
        if lang_col:
            known_langs = {
                "English", "French", "Anglais", "Français",
                "English / \nAnglais", "French / français"
            }
            anomalous = df[lang_col].dropna()
            anomalous = anomalous[~anomalous.isin(known_langs)]
            if not anomalous.empty:
                result.add_warning(
                    f"Unexpected '{lang_col}' values: {anomalous.unique().tolist()}. "
                    "Check for data entry errors."
                )

        # --- 8. Stats ---
        result.stats = {
            "rows": len(df),
            "columns": len(df.columns),
            "full_duplicate_rows": n_full_duplicates,
            "missing_per_column": df.isnull().sum().to_dict(),
        }

        result.ok = True
        result.data = df
        logger.info("Ingestion successful: %d rows loaded.", len(df))
        return result
