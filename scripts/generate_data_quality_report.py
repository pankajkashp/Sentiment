"""
Script: generate_data_quality_report.py
========================================
Generates a data quality report for the raw ap2016-18 dataset
and writes it to docs/research/data_quality_report_ap2016-18_v1.0.0.md

Run from project root:
    python scripts/generate_data_quality_report.py
"""

import sys
import os
from pathlib import Path

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.infrastructure.ingestion.csv_loader import CSVIngestionService
from backend.infrastructure.ingestion.data_quality import DataQualityReporter
from backend.infrastructure.ingestion.column_mapping import get_column_map

RAW_FILE = "data/raw/ap2016-18_individual_comments.csv"
DATASET_ID = "ap2016-18"
DATASET_VERSION = "1.0.0"
OUTPUT_DIR = Path("docs/research")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print(f"Loading {RAW_FILE}...")
    service = CSVIngestionService()
    result = service.load(RAW_FILE, dataset_id=DATASET_ID)

    if not result.ok:
        print("ERROR: Ingestion failed:")
        for e in result.errors:
            print(f"  - {e}")
        sys.exit(1)

    if result.warnings:
        print("WARNINGS from ingestion:")
        for w in result.warnings:
            print(f"  ⚠️  {w}")

    col_map = get_column_map(DATASET_ID)
    text_cols = col_map.primary_text_columns

    reporter = DataQualityReporter()
    report = reporter.generate(
        df=result.data,
        dataset_id=DATASET_ID,
        dataset_version=DATASET_VERSION,
        text_column_names=text_cols,
        raw_file_path=RAW_FILE,
    )

    # Write markdown report
    md_path = OUTPUT_DIR / f"data_quality_report_{DATASET_ID}_v{DATASET_VERSION}.md"
    md_path.write_text(report.to_markdown(), encoding="utf-8")
    print(f"\n✅ Markdown report written to: {md_path}")

    # Write JSON report
    json_path = OUTPUT_DIR / f"data_quality_report_{DATASET_ID}_v{DATASET_VERSION}.json"
    json_path.write_text(report.to_json(), encoding="utf-8")
    print(f"✅ JSON report written to: {json_path}")

    # Print summary
    print(f"\n--- Summary ---")
    print(f"  Rows:             {report.total_rows}")
    print(f"  Columns:          {report.total_columns}")
    print(f"  Full duplicates:  {report.full_duplicate_rows}")
    print(f"  Rows no text:     {report.rows_with_no_text_content}")
    print(f"  Global warnings:  {len(report.global_warnings)}")
    print(f"  Global errors:    {len(report.global_errors)}")

if __name__ == "__main__":
    main()
