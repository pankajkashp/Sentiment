#!/usr/bin/env python3
"""
PolicyLens — Semantic Grouping & Evidence-Backed Collective Verdict Prototype
Experiment Directory: experiments/semantic_clustering/

This experiment prototypes unsupervised semantic clustering of real citizen feedback
from the Open Government Consultation 2017–18 dataset (specifically Question 8:
'What other topics or commitments should Canada include in its next Open Government Action Plan?').

Core Principles:
1. Preserves original comments verbatim without alteration.
2. Embeds text using SentenceTransformer ('all-MiniLM-L6-v2').
3. Identifies cohesive policy themes and extracts representative evidence comments.
4. Produces an Issue Summary Table for collective decision-making.
5. All automatically generated concerns and requested actions are explicitly marked
   as [UNVERIFIED - Awaiting Human Review].
6. Prepares a targeted 50-comment annotation batch across identified clusters for human labeling.
"""

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("semantic_clustering")

# Directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
EXP_DIR = PROJECT_ROOT / "experiments" / "semantic_clustering"
DATA_DIR = EXP_DIR / "dataset"
FIGURES_DIR = EXP_DIR / "figures"
REPORTS_DIR = EXP_DIR / "reports"

for d in [DATA_DIR, FIGURES_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

INPUT_CLEANED_CSV = PROJECT_ROOT / "data" / "processed" / "policylens_comments_cleaned_v1.csv"
MODEL_NAME = "all-MiniLM-L6-v2"
RANDOM_SEED = 42


def load_substantive_feedback() -> pd.DataFrame:
    """Load cleaned comments and isolate substantive policy-demand feedback."""
    logger.info("Loading cleaned comments from %s...", INPUT_CLEANED_CSV)
    df = pd.read_csv(INPUT_CLEANED_CSV)
    logger.info("Total comments in dataset: %d", len(df))

    # Focus on Q8: Primary policy recommendation & commitment question
    q8_df = df[df["section_page"] == "Q8"].copy().reset_index(drop=True)
    logger.info("Selected Question 8 comments: %d records", len(q8_df))

    # Clean whitespace and drop empty comments
    q8_df["comment"] = q8_df["comment"].astype(str).str.strip()
    q8_df = q8_df[q8_df["comment"] != ""].copy().reset_index(drop=True)

    # Filter out trivial 1-word non-answers (e.g. 'None', 'N/A', 'No')
    trivial_tokens = {"none", "n/a", "no", "non", "aucun", "nil", "nothing", "na"}
    is_trivial = q8_df["comment"].str.lower().isin(trivial_tokens)
    q8_df = q8_df[~is_trivial].copy().reset_index(drop=True)
    logger.info("Retained %d substantive policy comments after dropping trivial responses.", len(q8_df))

    return q8_df


def compute_embeddings(texts: list[str]) -> np.ndarray:
    """Compute dense sentence embeddings using SentenceTransformer."""
    logger.info("Loading SentenceTransformer model '%s'...", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)
    logger.info("Encoding %d texts...", len(texts))
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        normalize_embeddings=True
    )
    logger.info("Embeddings matrix shape: %s", embeddings.shape)
    return embeddings


def find_optimal_clusters(embeddings: np.ndarray, k_range: range) -> tuple[int, dict[int, float]]:
    """Evaluate cluster cohesion across candidate K using silhouette score."""
    logger.info("Evaluating silhouette scores across K in %s...", list(k_range))
    scores = {}
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10)
        labels = km.fit_predict(embeddings)
        sil = float(silhouette_score(embeddings, labels))
        scores[k] = sil
        logger.info("K=%d -> Silhouette Score: %.4f", k, sil)

    # Select K with peak silhouette, balancing granularity (prefer k >= 6 for diverse policy topics)
    candidate_k = [k for k in k_range if k >= 6]
    best_k = max(candidate_k, key=lambda k: scores[k])
    logger.info("Selected optimal K=%d (Score: %.4f)", best_k, scores[best_k])
    return best_k, scores


def extract_cluster_keywords(df: pd.DataFrame, n_keywords: int = 6) -> dict[int, list[str]]:
    """Extract salient distinguishing n-grams per cluster via TF-IDF."""
    tfidf = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2
    )
    X = tfidf.fit_transform(df["comment"])
    feature_names = np.array(tfidf.get_feature_names_out())

    cluster_keywords = {}
    for c in sorted(df["cluster_id"].unique()):
        mask = (df["cluster_id"] == c).to_numpy()
        mean_vec = np.asarray(X[mask].mean(axis=0)).flatten()
        top_indices = mean_vec.argsort()[-n_keywords:][::-1]
        cluster_keywords[c] = feature_names[top_indices].tolist()

    return cluster_keywords


def assign_thematic_metadata(c_id: int, top_terms: list[str]) -> tuple[str, str, str]:
    """
    Derive draft policy theme, candidate concern, and candidate requested action.
    All candidate outputs are explicitly marked as [UNVERIFIED - Awaiting Human Review].
    """
    terms_str = " ".join(top_terms).lower()

    if any(w in terms_str for w in ["phoenix", "pay", "servants"]):
        theme = "Public Service Administration & Phoenix Pay System Resolution"
        concern = "[UNVERIFIED - Awaiting Human Review] Federal employees experience ongoing compensation failures, administrative distress, and fear of retaliation related to the Phoenix pay system rollout."
        action = "[UNVERIFIED - Awaiting Human Review] Dedicate immediate open government accountability tracking to resolving federal public service payroll systems and protecting whistleblower rights."
    elif any(w in terms_str for w in ["environment", "climate", "clean"]):
        theme = "Environmental Protection & Climate Action Transparency"
        concern = "[UNVERIFIED - Awaiting Human Review] Insufficient public disclosure and open monitoring of environmental assessments, carbon emissions, and corporate environmental compliance."
        action = "[UNVERIFIED - Awaiting Human Review] Mandate open environmental data publishing, real-time climate monitoring dashboards, and transparent regulatory review processes."
    elif any(w in terms_str for w in ["indigenous", "nations", "reconciliation", "aboriginal"]):
        theme = "Indigenous Reconciliation & Data Sovereignty"
        concern = "[UNVERIFIED - Awaiting Human Review] Open government initiatives fail to reflect Indigenous self-determination, reconciliation commitments, and the data sovereignty of First Nations, Inuit, and Métis."
        action = "[UNVERIFIED - Awaiting Human Review] Partner with Indigenous leadership to establish co-governed data frameworks aligned with OCAP principles and TRC Calls to Action."
    elif any(w in terms_str for w in ["spending", "tax", "money", "debt", "contracts"]):
        theme = "Fiscal Accountability, Public Spending & Procurement Transparency"
        concern = "[UNVERIFIED - Awaiting Human Review] Lack of transparent line-item visibility into federal spending, outsourced vendor contracting, and tax expenditures."
        action = "[UNVERIFIED - Awaiting Human Review] Publish comprehensive machine-readable procurement and budgetary disclosures with searchable vendor histories and expenditure audits."
    elif any(w in terms_str for w in ["data", "open data", "portal", "access", "privacy"]):
        theme = "Open Data Usability, Standards & Privacy Protection"
        concern = "[UNVERIFIED - Awaiting Human Review] Open data portals suffer from broken links, outdated datasets, non-standardized proprietary formats, and inadequate privacy safeguards."
        action = "[UNVERIFIED - Awaiting Human Review] Enforce mandatory open data standards (APIs, CSV, JSON), systematic data catalog refreshes, and clear citizen privacy-by-design guidelines."
    elif any(w in terms_str for w in ["accountability", "reform", "accountable", "decisions"]):
        theme = "Democratic Reform, Ethical Governance & Political Accountability"
        concern = "[UNVERIFIED - Awaiting Human Review] Citizens perceive a disconnect between public consultation promises and government decisions, driven by corporate lobbying and limited political accountability."
        action = "[UNVERIFIED - Awaiting Human Review] Tighten lobbying disclosure regulations, reform electoral and parliamentary transparency rules, and publish clear rationales for government decisions."
    elif any(w in terms_str for w in ["et", "la", "les", "des", "pour", "gouvernement"]):
        theme = "Francophone Civic Priorities & Bilingual Public Administration"
        concern = "[UNVERIFIED - Awaiting Human Review] Les citoyens francophones soulignent des lacunes dans l'accès bilingue équitable aux données gouvernementales et aux services publics ouverts."
        action = "[UNVERIFIED - Awaiting Human Review] Assurer la parité bilingue stricte dans la publication des données ouvertes et les mécanismes de consultation civique fédéraux."
    elif any(w in terms_str for w in ["health", "education", "job", "proportional"]):
        theme = "Social Policy Priorities: Health, Education & Electoral Reform"
        concern = "[UNVERIFIED - Awaiting Human Review] Citizen priorities focus heavily on healthcare access, education funding, and democratic representation mechanisms."
        action = "[UNVERIFIED - Awaiting Human Review] Expand open data commitments to track inter-governmental health transfers, educational outcomes, and electoral representation data."
    else:
        theme = "National Civic Priorities & Citizen-Centric Governance"
        concern = "[UNVERIFIED - Awaiting Human Review] Citizens express a broad desire for responsive government, reduced bureaucracy, and public services that directly benefit all Canadians."
        action = "[UNVERIFIED - Awaiting Human Review] Prioritize high-impact public service delivery benchmarks and measure citizen satisfaction across all open government commitments."

    return theme, concern, action


def run_experiment():
    """Execute complete semantic grouping and evidence extraction experiment."""
    logger.info("=== Starting PolicyLens Semantic Grouping Experiment ===")
    df = load_substantive_feedback()
    texts = df["comment"].tolist()

    # Step 1: Compute embeddings
    embeddings = compute_embeddings(texts)

    # Step 2: Determine optimal clusters
    best_k, sil_scores = find_optimal_clusters(embeddings, range(5, 11))

    # Step 3: Cluster comments
    km = KMeans(n_clusters=best_k, random_state=RANDOM_SEED, n_init=15)
    df["cluster_id"] = km.fit_predict(embeddings)

    # Plot silhouette curve
    plt.figure(figsize=(7, 4))
    plt.plot(list(sil_scores.keys()), list(sil_scores.values()), marker="o", color="#1f77b4", linewidth=2)
    plt.axvline(best_k, color="red", linestyle="--", label=f"Selected K={best_k}")
    plt.title("Silhouette Score vs. Number of Clusters (Question 8 Comments)")
    plt.xlabel("Number of Clusters (K)")
    plt.ylabel("Silhouette Coefficient")
    plt.grid(True, linestyle="--", alpha=0.5)
    plt.legend()
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "silhouette_scores.png", dpi=300)
    plt.close()

    # Step 4: Extract keywords per cluster
    keywords_dict = extract_cluster_keywords(df)

    # Step 5: Representative comments and issue summary table
    summary_rows = []
    df["cluster_theme"] = ""

    centroids = km.cluster_centers_

    for c in range(best_k):
        c_mask = (df["cluster_id"] == c).to_numpy()
        c_df = df[c_mask].copy()
        c_embs = embeddings[c_mask]

        # Compute cosine similarity of members to centroid
        centroid = centroids[c].reshape(1, -1)
        sims = cosine_similarity(c_embs, centroid).flatten()
        c_df["centroid_similarity"] = sims

        # Sort by similarity to find top central representatives
        top_reps = c_df.sort_values(by="centroid_similarity", ascending=False).head(3)

        top_terms = keywords_dict[c]
        theme, concern, action = assign_thematic_metadata(c, top_terms)
        df.loc[c_mask, "cluster_theme"] = theme

        # Assemble representative evidence excerpts
        rep_evidence = []
        for _, row in top_reps.iterrows():
            rep_evidence.append({
                "comment_id": row["comment_id"],
                "stakeholder": row["stakeholder"],
                "similarity": round(float(row["centroid_similarity"]), 4),
                "verbatim_excerpt": row["comment"][:250] + ("..." if len(row["comment"]) > 250 else ""),
                "source_url": row["source_url"]
            })

        summary_rows.append({
            "cluster_id": int(c),
            "cluster_theme": theme,
            "cluster_size": int(len(c_df)),
            "share_of_feedback_pct": round(len(c_df) / len(df) * 100, 2),
            "top_keywords": ", ".join(top_terms),
            "candidate_concern": concern,
            "candidate_requested_action": action,
            "verification_status": "UNVERIFIED (Awaiting Human Review)",
            "representative_comment_ids": [r["comment_id"] for r in rep_evidence],
            "representative_excerpts": [r["verbatim_excerpt"] for r in rep_evidence],
            "evidence_metadata": rep_evidence
        })

    summary_df = pd.DataFrame(summary_rows).sort_values(by="cluster_size", ascending=False).reset_index(drop=True)

    # Export clustered comments dataset (verbatim comments preserved)
    export_cols = [
        "comment_id",
        "cluster_id",
        "cluster_theme",
        "comment",
        "source_document",
        "source_url",
        "section_page",
        "stakeholder",
        "language",
        "source_question"
    ]
    clustered_csv_path = DATA_DIR / "policylens_q8_clustered_comments.csv"
    df[export_cols].to_csv(clustered_csv_path, index=False)
    logger.info("Saved clustered comments (%d rows) to %s", len(df), clustered_csv_path)

    # Export issue summary table (CSV and JSON)
    summary_csv_path = REPORTS_DIR / "policylens_issue_summary_table.csv"
    summary_json_path = REPORTS_DIR / "policylens_issue_summary_table.json"

    # CSV summary (flattened)
    csv_summary_df = summary_df[[
        "cluster_id",
        "cluster_theme",
        "cluster_size",
        "share_of_feedback_pct",
        "top_keywords",
        "candidate_concern",
        "candidate_requested_action",
        "verification_status",
        "representative_comment_ids"
    ]]
    csv_summary_df.to_csv(summary_csv_path, index=False)
    with open(summary_json_path, "w", encoding="utf-8") as jf:
        json.dump(summary_rows, jf, indent=2)
    logger.info("Saved issue summary table to %s and %s", summary_csv_path, summary_json_path)

    # Step 6: Visualizations
    # 6.1 Cluster size distribution
    plt.figure(figsize=(10, 5))
    sns.barplot(
        data=summary_df,
        x="cluster_size",
        y="cluster_theme",
        hue="cluster_theme",
        palette="viridis",
        legend=False
    )
    plt.title("Policy Issue Clusters Identified from Question 8 Comments (N=2,174)")
    plt.xlabel("Number of Citizen Comments in Cluster")
    plt.ylabel("Policy Issue Theme")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "cluster_size_distribution.png", dpi=300)
    plt.close()

    # 6.2 2D PCA projection of semantic embeddings
    pca = PCA(n_components=2, random_state=RANDOM_SEED)
    pca_coords = pca.fit_transform(embeddings)
    df["pca_x"] = pca_coords[:, 0]
    df["pca_y"] = pca_coords[:, 1]

    plt.figure(figsize=(10, 7))
    sns.scatterplot(
        data=df,
        x="pca_x",
        y="pca_y",
        hue="cluster_theme",
        palette="tab10",
        alpha=0.6,
        s=30
    )
    plt.title("2D PCA Semantic Projection of Policy Consultation Comments")
    plt.xlabel(f"PCA Component 1 ({pca.explained_variance_ratio_[0]*100:.1f}% var)")
    plt.ylabel(f"PCA Component 2 ({pca.explained_variance_ratio_[1]*100:.1f}% var)")
    plt.legend(bbox_to_anchor=(1.05, 1), loc="upper left", title="Policy Theme")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "cluster_pca_projection.png", dpi=300)
    plt.close()

    # Step 7: Prepare a small targeted 50-comment annotation batch across the clusters
    logger.info("Preparing diverse 50-comment pilot annotation batch for human coders...")
    annotation_samples = []
    # Stratify across clusters proportionally to cluster size
    for c in range(best_k):
        c_df = df[df["cluster_id"] == c]
        # select central and diverse items
        n_sample = max(4, int(round(50 * (len(c_df) / len(df)))))
        sample = c_df.sample(n=min(n_sample, len(c_df)), random_state=RANDOM_SEED)
        annotation_samples.append(sample)

    annotation_df = pd.concat(annotation_samples).head(50).copy().reset_index(drop=True)
    annotation_df["topic"] = ""
    annotation_df["stance"] = ""
    annotation_df["concern"] = ""
    annotation_df["demand"] = ""

    batch_cols = [
        "comment_id",
        "cluster_id",
        "cluster_theme",
        "comment",
        "source_document",
        "source_url",
        "section_page",
        "stakeholder",
        "language",
        "topic",
        "stance",
        "concern",
        "demand"
    ]
    pilot_batch_path = DATA_DIR / "policylens_pilot_annotation_batch_50.csv"
    annotation_df[batch_cols].to_csv(pilot_batch_path, index=False)
    logger.info("Saved 50-comment pilot annotation batch to %s", pilot_batch_path)

    logger.info("=== PolicyLens Semantic Grouping Experiment Completed Successfully ===")
    return summary_df


if __name__ == "__main__":
    run_experiment()
