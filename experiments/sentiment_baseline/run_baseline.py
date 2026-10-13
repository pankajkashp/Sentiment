#!/usr/bin/env python3
"""
PolicyLens — Baseline Sentiment Analysis Experiment
Replaces the unavailable Amazon Reviews Multi dataset with McAuley-Lab/Amazon-Reviews-2023.

Product Category: Subscription_Boxes (16,216 reviews, 16,205 with usable text)
Schema Confirmation:
    - Text field: 'text' (str)
    - Rating field: 'rating' (float)
Label Mapping:
    - 1.0, 2.0 -> Negative
    - 3.0      -> Neutral
    - 4.0, 5.0 -> Positive
Deduplication & Leakage Prevention:
    - Review text grouping prevents identical reviews from crossing train/val/test splits.
Models:
    - TF-IDF + Logistic Regression
    - TF-IDF + Linear Support Vector Machine (LinearSVC)
"""

import os
import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score
)
from huggingface_hub import hf_hub_download

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("sentiment_baseline")

# Directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
EXP_DIR = PROJECT_ROOT / "experiments" / "sentiment_baseline"
DATA_DIR = EXP_DIR / "dataset"
MODELS_DIR = EXP_DIR / "models"
METRICS_DIR = EXP_DIR / "metrics"
FIGURES_DIR = EXP_DIR / "figures"

for d in [DATA_DIR, MODELS_DIR, METRICS_DIR, FIGURES_DIR]:
    d.mkdir(parents=True, exist_ok=True)

DATASET_REPO = "McAuley-Lab/Amazon-Reviews-2023"
CATEGORY_FILE = "raw/review_categories/Subscription_Boxes.jsonl"
CATEGORY_NAME = "Subscription_Boxes"
RANDOM_SEED = 42
CLASS_LABELS = ["Negative", "Neutral", "Positive"]


def map_rating_to_sentiment(rating: float) -> str:
    """Map 1.0-5.0 numerical rating to 3-class sentiment."""
    if rating in (1.0, 2.0):
        return "Negative"
    elif rating == 3.0:
        return "Neutral"
    elif rating in (4.0, 5.0):
        return "Positive"
    else:
        raise ValueError(f"Unexpected rating value: {rating}")


def load_and_verify_dataset() -> tuple[pd.DataFrame, int]:
    """Download (if needed) and load Subscription_Boxes reviews."""
    logger.info("Verifying dataset download from Hugging Face Hub (%s)...", DATASET_REPO)
    try:
        downloaded_path = hf_hub_download(
            repo_id=DATASET_REPO,
            filename=CATEGORY_FILE,
            repo_type="dataset"
        )
    except Exception as e:
        logger.error("Failed to download %s: %s", CATEGORY_FILE, e)
        raise RuntimeError(f"Dataset download failed for {CATEGORY_FILE}: {e}") from e

    logger.info("Reading raw reviews from: %s", downloaded_path)
    records = []
    with open(downloaded_path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if line_str:
                records.append(json.loads(line_str))

    df = pd.DataFrame(records)
    logger.info("Loaded %d raw review records with %d columns.", len(df), len(df.columns))

    # Schema verification
    assert "rating" in df.columns, "Schema error: 'rating' column missing!"
    assert "text" in df.columns, "Schema error: 'text' column missing!"
    logger.info("Schema verified: 'text' and 'rating' fields present.")

    # Drop null or whitespace-only text
    initial_count = len(df)
    df = df[df["text"].notna()].copy()
    df["text"] = df["text"].astype(str).str.strip()
    df = df[df["text"] != ""].copy()
    dropped_empty = initial_count - len(df)
    logger.info("Filtered %d empty/whitespace reviews. Usable reviews: %d", dropped_empty, len(df))

    # Map sentiment
    df["sentiment"] = df["rating"].apply(map_rating_to_sentiment)
    logger.info("Sentiment breakdown:\n%s", df["sentiment"].value_counts().to_string())

    return df, dropped_empty


def split_data_without_leakage(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split data into 80% train, 10% val, 10% test.
    Groups by exact text string to guarantee duplicate reviews NEVER cross splits.
    """
    logger.info("Performing leakage-free train/val/test splitting...")

    # Group by text string and determine modal sentiment for stratification
    text_summary = df.groupby("text").agg(
        sentiment=("sentiment", lambda s: s.mode()[0]),
        count=("rating", "count")
    ).reset_index()

    logger.info("Unique text strings: %d (Duplicates in dataset: %d)", len(text_summary), len(df) - len(text_summary))

    # Split unique texts: 80% train, 20% temp (stratified)
    train_texts, temp_texts = train_test_split(
        text_summary,
        test_size=0.20,
        random_state=RANDOM_SEED,
        stratify=text_summary["sentiment"]
    )

    # Split temp texts: 50% val (10% total), 50% test (10% total)
    val_texts, test_texts = train_test_split(
        temp_texts,
        test_size=0.50,
        random_state=RANDOM_SEED,
        stratify=temp_texts["sentiment"]
    )

    split_map = {t: "train" for t in train_texts["text"]}
    split_map.update({t: "val" for t in val_texts["text"]})
    split_map.update({t: "test" for t in test_texts["text"]})

    df["split"] = df["text"].map(split_map)

    train_df = df[df["split"] == "train"].copy().reset_index(drop=True)
    val_df = df[df["split"] == "val"].copy().reset_index(drop=True)
    test_df = df[df["split"] == "test"].copy().reset_index(drop=True)

    # Verification: Assert zero text leakage
    train_text_set = set(train_df["text"])
    val_text_set = set(val_df["text"])
    test_text_set = set(test_df["text"])

    assert len(train_text_set & val_text_set) == 0, "Data leakage detected: train and val share texts!"
    assert len(train_text_set & test_text_set) == 0, "Data leakage detected: train and test share texts!"
    assert len(val_text_set & test_text_set) == 0, "Data leakage detected: val and test share texts!"
    logger.info("Zero text leakage verified across all split boundaries.")

    # Save splits
    train_df.to_csv(DATA_DIR / "train.csv", index=False)
    val_df.to_csv(DATA_DIR / "val.csv", index=False)
    test_df.to_csv(DATA_DIR / "test.csv", index=False)
    logger.info("Saved train.csv (%d), val.csv (%d), test.csv (%d) to %s", len(train_df), len(val_df), len(test_df), DATA_DIR)

    return train_df, val_df, test_df


def plot_confusion_matrix(cm: np.ndarray, model_name: str, output_path: Path):
    """Plot and save confusion matrix heatmap."""
    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_LABELS,
        yticklabels=CLASS_LABELS,
        cbar=False
    )
    plt.title(f"Confusion Matrix: {model_name}")
    plt.xlabel("Predicted Sentiment")
    plt.ylabel("Ground Truth Sentiment")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    logger.info("Saved confusion matrix plot: %s", output_path)


def run_experiment():
    """Main experiment runner."""
    df, dropped_empty = load_and_verify_dataset()
    train_df, val_df, test_df = split_data_without_leakage(df)

    # Plot class distributions
    plt.figure(figsize=(8, 4))
    split_summary = pd.crosstab(df["split"], df["sentiment"])[CLASS_LABELS]
    split_summary.plot(kind="bar", stacked=True, figsize=(8, 5), colormap="viridis")
    plt.title("Sentiment Class Distribution Across Splits (Subscription_Boxes)")
    plt.xlabel("Dataset Split")
    plt.ylabel("Number of Reviews")
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "class_distribution.png", dpi=300)
    plt.close()

    # Feature extraction: TF-IDF
    logger.info("Fitting TF-IDF Vectorizer (max_features=10,000, ngrams=(1,2))...")
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2
    )
    X_train = vectorizer.fit_transform(train_df["text"])
    X_val = vectorizer.transform(val_df["text"])
    X_test = vectorizer.transform(test_df["text"])

    y_train = train_df["sentiment"].values
    y_val = val_df["sentiment"].values
    y_test = test_df["sentiment"].values

    joblib.dump(vectorizer, MODELS_DIR / "tfidf_vectorizer.joblib")
    logger.info("Saved TF-IDF vectorizer to %s", MODELS_DIR / "tfidf_vectorizer.joblib")

    # Models to train & evaluate
    models = {
        "Logistic Regression (Standard)": LogisticRegression(max_iter=1000, random_state=RANDOM_SEED),
        "Logistic Regression (Balanced)": LogisticRegression(max_iter=1000, random_state=RANDOM_SEED, class_weight="balanced"),
        "Linear SVM (Standard)": LinearSVC(random_state=RANDOM_SEED),
        "Linear SVM (Balanced)": LinearSVC(random_state=RANDOM_SEED, class_weight="balanced")
    }

    results = {}

    for name, model in models.items():
        logger.info("Training %s...", name)
        model.fit(X_train, y_train)

        # Predictions on Validation and Test
        y_val_pred = model.predict(X_val)
        y_test_pred = model.predict(X_test)

        # Metrics on Test Set
        acc = float(accuracy_score(y_test, y_test_pred))
        macro_f1 = float(f1_score(y_test, y_test_pred, average="macro"))
        weighted_f1 = float(f1_score(y_test, y_test_pred, average="weighted"))
        cm = confusion_matrix(y_test, y_test_pred, labels=CLASS_LABELS)

        # Validation Metrics
        val_acc = float(accuracy_score(y_val, y_val_pred))
        val_macro_f1 = float(f1_score(y_val, y_val_pred, average="macro"))

        # Per-class metrics
        per_class = {}
        for cls in CLASS_LABELS:
            mask = (y_test == cls)
            pred_mask = (y_test_pred == cls)
            p = float(precision_score(y_test, y_test_pred, labels=[cls], average="micro", zero_division=0))
            r = float(recall_score(y_test, y_test_pred, labels=[cls], average="micro", zero_division=0))
            f1 = float(f1_score(y_test, y_test_pred, labels=[cls], average="micro", zero_division=0))
            per_class[cls] = {
                "precision": round(p, 4),
                "recall": round(r, 4),
                "f1_score": round(f1, 4),
                "support": int(mask.sum())
            }

        report_txt = classification_report(y_test, y_test_pred, labels=CLASS_LABELS, digits=4)

        results[name] = {
            "validation": {
                "accuracy": round(val_acc, 4),
                "macro_f1": round(val_macro_f1, 4)
            },
            "test": {
                "accuracy": round(acc, 4),
                "macro_f1": round(macro_f1, 4),
                "weighted_f1": round(weighted_f1, 4),
                "per_class": per_class,
                "confusion_matrix": cm.tolist()
            }
        }

        # Save model artifact
        slug = name.lower().replace(" ", "_").replace("(", "").replace(")", "")
        joblib.dump(model, MODELS_DIR / f"{slug}.joblib")

        # Save classification report and confusion matrix csv
        with open(METRICS_DIR / f"classification_report_{slug}.txt", "w") as rf:
            rf.write(f"=== {name} Test Set Report ===\n\n")
            rf.write(report_txt)

        cm_df = pd.DataFrame(cm, index=CLASS_LABELS, columns=CLASS_LABELS)
        cm_df.to_csv(METRICS_DIR / f"confusion_matrix_{slug}.csv")

        # Plot confusion matrix
        plot_confusion_matrix(cm, name, FIGURES_DIR / f"confusion_matrix_{slug}.png")

        logger.info(
            "%s -> Test Accuracy: %.4f, Macro-F1: %.4f | Val Acc: %.4f, Val Macro-F1: %.4f",
            name, acc, macro_f1, val_acc, val_macro_f1
        )

    # Save summary JSON
    summary_path = METRICS_DIR / "evaluation_summary.json"
    with open(summary_path, "w") as jf:
        json.dump(results, jf, indent=2)
    logger.info("Saved evaluation summary to %s", summary_path)

    # Plot comparison chart
    comp_df = pd.DataFrame([
        {
            "Model": m,
            "Accuracy": results[m]["test"]["accuracy"],
            "Macro-F1": results[m]["test"]["macro_f1"]
        }
        for m in results
    ])
    plt.figure(figsize=(9, 5))
    x = np.arange(len(comp_df))
    width = 0.35
    plt.bar(x - width/2, comp_df["Accuracy"], width, label="Accuracy", color="#1f77b4")
    plt.bar(x + width/2, comp_df["Macro-F1"], width, label="Macro-F1", color="#ff7f0e")
    plt.xticks(x, comp_df["Model"], rotation=15, ha="right")
    plt.ylim(0, 1.0)
    plt.ylabel("Score")
    plt.title("Baseline Sentiment Performance on Subscription_Boxes Test Set")
    plt.legend()
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "performance_comparison.png", dpi=300)
    plt.close()
    logger.info("Saved performance comparison plot.")

    # Save metadata.json
    metadata = {
        "dataset_name": DATASET_REPO,
        "category": CATEGORY_NAME,
        "source_file": CATEGORY_FILE,
        "license": "Academic / Research Use (Julian McAuley Lab, UCSD)",
        "citation": "Hou et al., Bridging Language and Items for Retrieval and Recommendation, arXiv:2403.03952, 2024",
        "schema": {
            "text_field": "text",
            "rating_field": "rating",
            "rating_mapping": {
                "1.0, 2.0": "Negative",
                "3.0": "Neutral",
                "4.0, 5.0": "Positive"
            }
        },
        "statistics": {
            "raw_records": len(df) + dropped_empty,
            "usable_records": len(df),
            "unique_text_strings": int(df["text"].nunique()),
            "train_size": len(train_df),
            "val_size": len(val_df),
            "test_size": len(test_df),
            "train_ratio": round(len(train_df) / len(df), 4),
            "val_ratio": round(len(val_df) / len(df), 4),
            "test_ratio": round(len(test_df) / len(df), 4)
        },
        "leakage_prevention": "Group-level stratified splitting on text ensures zero review overlap between splits."
    }
    with open(DATA_DIR / "metadata.json", "w") as mf:
        json.dump(metadata, mf, indent=2)
    logger.info("Saved dataset metadata to %s", DATA_DIR / "metadata.json")

    logger.info("Baseline experiment execution completed successfully.")
    return results


if __name__ == "__main__":
    run_experiment()
