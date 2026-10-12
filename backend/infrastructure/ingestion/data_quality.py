"""
PolicyLens — Data Quality Report Generator
============================================
Produces a reproducible, versioned data quality report for a raw dataset.

This module is READ-ONLY with respect to the source data.
It inspects and reports. It never modifies.

Usage:
    from backend.infrastructure.ingestion.data_quality import DataQualityReporter
    reporter = DataQualityReporter()
    report = reporter.generate(df, dataset_id="ap2016-18", dataset_version="1.0.0")
    print(report.to_markdown())
"""

from __future__ import annotations

import json
import hashlib
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import pandas as pd
import numpy as np


# ---------------------------------------------------------------------------
# Report data structures
# ---------------------------------------------------------------------------

@dataclass
class ColumnQuality:
    semantic_name: str
    dtype: str
    total_rows: int
    null_count: int
    null_pct: float
    unique_count: int
    duplicate_count: int          # values that appear more than once
    min_length: Optional[float]   # for text columns
    max_length: Optional[float]
    mean_length: Optional[float]
    sample_values: List[str]
    warnings: List[str] = field(default_factory=list)


@dataclass
class DataQualityReport:
    dataset_id: str
    dataset_version: str
    generated_at: str             # ISO 8601
    total_rows: int
    total_columns: int
    full_duplicate_rows: int
    rows_with_no_text_content: int
    dataframe_hash: str           # SHA-256 of the raw CSV bytes for reproducibility
    column_reports: List[ColumnQuality]
    global_warnings: List[str]
    global_errors: List[str]

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def to_markdown(self) -> str:
        lines = [
            f"# Data Quality Report: `{self.dataset_id}` v{self.dataset_version}",
            f"\n**Generated:** {self.generated_at}",
            f"**Rows:** {self.total_rows}  |  **Columns:** {self.total_columns}",
            f"**Full duplicate rows:** {self.full_duplicate_rows}",
            f"**Rows with no text content:** {self.rows_with_no_text_content}",
            f"**DataFrame hash (SHA-256):** `{self.dataframe_hash}`",
        ]

        if self.global_errors:
            lines.append("\n## ❌ Errors")
            for e in self.global_errors:
                lines.append(f"- {e}")

        if self.global_warnings:
            lines.append("\n## ⚠️ Global Warnings")
            for w in self.global_warnings:
                lines.append(f"- {w}")

        lines.append("\n## Column-Level Quality")
        lines.append(
            "| Column | DType | Null % | Unique | Min Len | Max Len | Avg Len | Warnings |"
        )
        lines.append(
            "|--------|-------|--------|--------|---------|---------|---------|----------|"
        )
        for c in self.column_reports:
            min_l = f"{c.min_length:.0f}" if c.min_length is not None else "—"
            max_l = f"{c.max_length:.0f}" if c.max_length is not None else "—"
            avg_l = f"{c.mean_length:.1f}" if c.mean_length is not None else "—"
            warn_str = "; ".join(c.warnings) if c.warnings else "OK"
            lines.append(
                f"| `{c.semantic_name}` | {c.dtype} | {c.null_pct:.1f}% "
                f"| {c.unique_count} | {min_l} | {max_l} | {avg_l} | {warn_str} |"
            )

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Reporter
# ---------------------------------------------------------------------------

class DataQualityReporter:
    """
    Generates a DataQualityReport from an already-loaded, column-renamed DataFrame.

    The DataFrame must have already been processed by CSVIngestionService
    (i.e. columns are semantic names, not raw CSV headers).
    """

    # Null percentage thresholds for warnings
    WARN_NULL_PCT_HIGH = 50.0
    WARN_NULL_PCT_MEDIUM = 25.0

    # Text columns to check for empty-string content
    TEXT_ROLES = {"text"}

    def generate(
        self,
        df: pd.DataFrame,
        dataset_id: str,
        dataset_version: str,
        text_column_names: Optional[List[str]] = None,
        raw_file_path: Optional[str] = None,
    ) -> DataQualityReport:
        """
        Generate a data quality report.

        Args:
            df:                  DataFrame with semantic column names.
            dataset_id:          Dataset identifier.
            dataset_version:     Dataset version string.
            text_column_names:   List of semantic names of text columns.
                                 Used to compute 'rows with no text content'.
            raw_file_path:       Path to raw file for SHA-256 fingerprinting.

        Returns:
            DataQualityReport
        """
        global_warnings: List[str] = []
        global_errors: List[str] = []
        column_reports: List[ColumnQuality] = []

        total_rows = len(df)
        total_cols = len(df.columns)

        # --- Duplicate check ---
        full_dups = int(df.duplicated().sum())
        if full_dups > 0:
            global_warnings.append(
                f"{full_dups} fully duplicate rows detected. "
                "Deduplication strategy must be decided before annotation split."
            )

        # --- File hash ---
        file_hash = "unavailable"
        if raw_file_path:
            try:
                import hashlib
                sha = hashlib.sha256()
                with open(raw_file_path, "rb") as f:
                    while chunk := f.read(65536):
                        sha.update(chunk)
                file_hash = sha.hexdigest()
            except OSError:
                global_warnings.append("Could not compute file hash — file path unavailable.")

        # --- Rows with no text content ---
        rows_no_text = 0
        if text_column_names:
            mask = df[text_column_names].isnull().all(axis=1)
            # Also treat whitespace-only strings as empty
            for col in text_column_names:
                if col in df.columns:
                    mask = mask | (df[col].fillna("").str.strip() == "")
            # rows where ALL text columns are empty
            all_null_mask = pd.Series([True] * total_rows, index=df.index)
            for col in text_column_names:
                if col in df.columns:
                    col_empty = df[col].isnull() | (df[col].fillna("").str.strip() == "")
                    all_null_mask = all_null_mask & col_empty
            rows_no_text = int(all_null_mask.sum())
            if rows_no_text > 0:
                global_warnings.append(
                    f"{rows_no_text} rows have no content in any text column."
                )

        # --- Per-column analysis ---
        for col in df.columns:
            series = df[col]
            dtype_str = str(series.dtype)
            null_count = int(series.isnull().sum())
            null_pct = 100.0 * null_count / total_rows if total_rows > 0 else 0.0
            unique_count = int(series.nunique(dropna=True))
            non_null = series.dropna()
            dup_count = int(non_null.duplicated().sum())

            col_warnings: List[str] = []

            # Length stats for string columns
            min_len = max_len = mean_len = None
            sample_vals: List[str] = []

            if series.dtype == object:
                lengths = non_null.astype(str).str.len()
                if not lengths.empty:
                    min_len = float(lengths.min())
                    max_len = float(lengths.max())
                    mean_len = float(lengths.mean())
                sample_vals = [str(v)[:150] for v in non_null.head(2).tolist()]

                # Warn: whitespace-only values
                ws_only = int((non_null.str.strip() == "").sum())
                if ws_only > 0:
                    col_warnings.append(f"{ws_only} whitespace-only values")
            else:
                sample_vals = [str(v) for v in non_null.head(2).tolist()]

            # Null thresholds
            if null_pct >= self.WARN_NULL_PCT_HIGH:
                col_warnings.append(f"HIGH missingness: {null_pct:.1f}%")
            elif null_pct >= self.WARN_NULL_PCT_MEDIUM:
                col_warnings.append(f"MEDIUM missingness: {null_pct:.1f}%")

            column_reports.append(ColumnQuality(
                semantic_name=col,
                dtype=dtype_str,
                total_rows=total_rows,
                null_count=null_count,
                null_pct=round(null_pct, 2),
                unique_count=unique_count,
                duplicate_count=dup_count,
                min_length=min_len,
                max_length=max_len,
                mean_length=round(mean_len, 2) if mean_len is not None else None,
                sample_values=sample_vals,
                warnings=col_warnings,
            ))

        return DataQualityReport(
            dataset_id=dataset_id,
            dataset_version=dataset_version,
            generated_at=datetime.now(timezone.utc).isoformat(),
            total_rows=total_rows,
            total_columns=total_cols,
            full_duplicate_rows=full_dups,
            rows_with_no_text_content=rows_no_text,
            dataframe_hash=file_hash,
            column_reports=column_reports,
            global_warnings=global_warnings,
            global_errors=global_errors,
        )
