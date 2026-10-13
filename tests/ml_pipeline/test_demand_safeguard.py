#!/usr/bin/env python3
"""
PolicyLens — Regression Tests for Demand-Presence Detection & Evidence Safeguards

Tests:
1. Explicit demands (imperatives, deontic modals, polite requests, French directives).
2. Action verbs in descriptive complaints (past-tense narratives, operational failures) that do NOT indicate a request.
3. Implicit but reasonably clear policy demands (nominalized reform goals, comparative goals).
4. Bare topics, concerns without demands, and fragmentary/unclear submissions.
5. Preservation of blank demands (empty demands remain strictly empty).
6. Evidence attribution hierarchy (respondent explicit vs model inferred vs analyst proposed).
"""

import pandas as pd
import pytest

from experiments.model_benchmark.demand_detector import (
    DemandAttributionTier,
    DemandDetectionResult,
    DemandPresenceDetector,
    DemandStatus,
    SafeguardDecision,
)
from experiments.model_benchmark.evaluate_demand_safeguard import evaluate_safeguard_pipeline
from experiments.model_benchmark.collective_verdict import aggregate_collective_verdict


@pytest.fixture
def detector() -> DemandPresenceDetector:
    return DemandPresenceDetector()


class TestDemandPresenceDetection:
    """Validate linguistic discrimination of citizen demands vs non-demand grievances."""

    def test_explicit_imperatives_and_modals(self, detector: DemandPresenceDetector):
        """Explicit imperatives and deontic modals must be classified as EXPLICIT_DEMAND."""
        # Imperative
        res1 = detector.detect("Fix the Phoenix pay system immediately.", comment_id="TEST_01")
        assert res1.demand_status == DemandStatus.EXPLICIT_DEMAND
        assert res1.attribution_tier == DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND
        assert res1.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND
        assert "Phoenix" in res1.extracted_demand

        # Deontic modal
        res2 = detector.detect("The government must publish all consulting contracts.", comment_id="TEST_02")
        assert res2.demand_status == DemandStatus.EXPLICIT_DEMAND
        assert res2.attribution_tier == DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND
        assert res2.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND
        assert len(res2.extracted_demand) > 0

        # Polite request marker
        res3 = detector.detect("Please provide downloadable raw CSV data on open government portal.", comment_id="TEST_03")
        assert res3.demand_status == DemandStatus.EXPLICIT_DEMAND
        assert res3.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND

        # French directive
        res4 = detector.detect("Revoir la politique de subventions aux entreprises et éliminer le gaspillage.", comment_id="TEST_04")
        assert res4.demand_status == DemandStatus.EXPLICIT_DEMAND
        assert res4.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND

    def test_action_verbs_in_descriptive_grievance_are_not_demands(self, detector: DemandPresenceDetector):
        """Past-tense action verbs describing past events or grievances must NOT be extracted as demands."""
        # Past-tense action verb: "I filed", "haven't received"
        comment_filed = "I filed an ATIP request with the department six months ago and haven't received an acknowledgment."
        res1 = detector.detect(comment_filed, comment_id="GRIEVANCE_01")
        assert res1.demand_status == DemandStatus.CONCERN_ONLY
        assert res1.safeguard_decision == SafeguardDecision.DEMAND_SUPPRESSED_NO_ACTION_REQUESTED
        assert res1.extracted_demand == ""
        assert res1.attribution_tier == DemandAttributionTier.NONE_UNSTATED

        # Action verb in operational description: "answered", "phone"
        comment_answered = "Call centre agents only answered the phone about one-third of the time when citizens called."
        res2 = detector.detect(comment_answered, comment_id="GRIEVANCE_02")
        assert res2.demand_status == DemandStatus.CONCERN_ONLY
        assert res2.safeguard_decision == SafeguardDecision.DEMAND_SUPPRESSED_NO_ACTION_REQUESTED
        assert res2.extracted_demand == ""

        # Narrative of frustration
        comment_tried = "I tried to navigate the government portal but it was a catastrophe and nobody answered."
        res3 = detector.detect(comment_tried, comment_id="GRIEVANCE_03")
        assert res3.demand_status == DemandStatus.CONCERN_ONLY
        assert res3.extracted_demand == ""

    def test_implicit_policy_reforms_detected(self, detector: DemandPresenceDetector):
        """Nominalized reform desires and comparative targets should be recognized as IMPLICIT_DEMAND."""
        comment_comp = "More transparency and accountability in federal judicial appointments."
        res1 = detector.detect(comment_comp, comment_id="IMPLICIT_01")
        assert res1.demand_status in [DemandStatus.IMPLICIT_DEMAND, DemandStatus.EXPLICIT_DEMAND]
        assert res1.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND
        assert len(res1.extracted_demand) > 0

        comment_nom = "Substantial reduction in administrative burden for non-profit organizations."
        res2 = detector.detect(comment_nom, comment_id="IMPLICIT_02")
        assert res2.demand_status in [DemandStatus.IMPLICIT_DEMAND, DemandStatus.EXPLICIT_DEMAND]
        assert res2.safeguard_decision == SafeguardDecision.EXTRACT_CITIZEN_DEMAND

    def test_bare_topics_and_concerns_without_demands(self, detector: DemandPresenceDetector):
        """Bare topic nouns and concern-only comments must preserve empty demands."""
        # Bare topic nouns
        for topic in ["poverty", "senate reform", "health"]:
            res = detector.detect(topic, comment_id="TOPIC_01")
            assert res.demand_status == DemandStatus.CONCERN_ONLY
            assert res.safeguard_decision == SafeguardDecision.DEMAND_SUPPRESSED_NO_ACTION_REQUESTED
            assert res.extracted_demand == ""
            assert res.attribution_tier == DemandAttributionTier.NONE_UNSTATED

    def test_fragmentary_and_unclear_comments_flagged_for_review(self, detector: DemandPresenceDetector):
        """Punctuation, single tokens, or unclear text must be flagged for human review, NOT invented."""
        # Punctuation only
        res_punct = detector.detect(".", comment_id="PUNCT_01")
        assert res_punct.demand_status == DemandStatus.UNCLEAR_OR_INSUFFICIENT
        assert res_punct.safeguard_decision == SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW
        assert res_punct.extracted_demand == ""

        # Non-committal short text
        res_none = detector.detect("n/a", comment_id="NA_01")
        assert res_punct.demand_status == DemandStatus.UNCLEAR_OR_INSUFFICIENT
        assert res_none.extracted_demand == ""


class TestEvidenceAttributionHierarchy:
    """Verify strict three-tier evidence attribution and non-equivalence rules."""

    def test_three_tier_attribution_distinction(self):
        """Ensure respondent explicit demands, model inferences, and analyst proposals are distinct."""
        tier1 = DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND
        tier2 = DemandAttributionTier.MODEL_INFERRED_RECOMMENDATION
        tier3 = DemandAttributionTier.ANALYST_PROPOSED_ACTION
        tier4 = DemandAttributionTier.NONE_UNSTATED

        # All four tiers must be strictly distinct
        assert len({tier1, tier2, tier3, tier4}) == 4
        assert tier1.value != tier2.value
        assert tier2.value != tier3.value
        assert tier1.value != tier3.value

    def test_empty_demands_preserved_in_collective_verdict(self):
        """Collective verdict must NOT attach cluster candidate action to concern-only comments."""
        test_df = pd.DataFrame({
            "comment_id": ["CID_CONCERN_01", "CID_CONCERN_02", "CID_EXPLICIT_03"],
            "cluster_id": [99, 99, 99],
            "candidate_cluster_theme": [
                "[UNVERIFIED] Theme 99: Administrative Complaints",
                "[UNVERIFIED] Theme 99: Administrative Complaints",
                "[UNVERIFIED] Theme 99: Administrative Complaints",
            ],
            "candidate_requested_action": [
                "Systemic review of service standards",
                "Systemic review of service standards",
                "Systemic review of service standards",
            ],
            "comment": [
                "Call centre agents only answered the phone about one-third of the time.",  # Concern only
                "I filed an ATIP request and haven't received anything.",                     # Concern only
                "Publish all call center response rates monthly on the open data portal.",   # Explicit demand
            ],
            "stakeholder": ["Public", "Public", "Public"],
            "source_url": ["http://test.url", "http://test.url", "http://test.url"],
            "stance": ["OPPOSE", "OPPOSE", "SUPPORT"],
        })

        verdict = aggregate_collective_verdict(test_df, min_confidence_sample_size=1)
        finding = verdict.findings_by_importance[0]

        # Verify requested actions
        actions = finding["requested_actions"]
        assert len(actions) >= 1

        # Check citizen demand: only CID_EXPLICIT_03 should be attributed as RESPONDENT_EXPLICIT_DEMAND
        citizen_actions = [a for a in actions if a["attribution_tier"] == DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND.value]
        assert len(citizen_actions) == 1
        assert citizen_actions[0]["source_comment_id"] == "CID_EXPLICIT_03"
        assert "Publish" in citizen_actions[0]["action_text"]

        # Check cluster action: must be MODEL_INFERRED_RECOMMENDATION, NOT attributed to CID_CONCERN_01 or 02!
        cluster_actions = [a for a in actions if a["attribution_tier"] == DemandAttributionTier.MODEL_INFERRED_RECOMMENDATION.value]
        assert len(cluster_actions) == 1
        assert cluster_actions[0]["source_comment_id"] == "CLUSTER_99_SYNTHESIS"
        assert cluster_actions[0]["action_text"] == "Systemic review of service standards"


class TestSafeguardEvaluationOnSyntheticDataset:
    """Verify metric computation logic in safeguard evaluation pipeline."""

    def test_safeguard_evaluation_pipeline(self):
        """Safeguard evaluation must correctly count preserved empty demands and prevent hallucinations."""
        toy_df = pd.DataFrame({
            "comment_id": ["C1", "C2", "C3", "C4"],
            "cluster_id": [1, 1, 2, 2],
            "comment": [
                "Fix the Phoenix pay system immediately.",
                "Call centre agents only answered the phone about one-third of the time.",
                "poverty",
                "Please publish real-time open datasets.",
            ],
            "demand": ["Fix Phoenix", "", "", "Publish real-time open datasets"],  # 2 empty, 2 with demand
        })

        metrics, comp_df = evaluate_safeguard_pipeline(toy_df)
        assert metrics["total_evaluated_records"] == 4
        assert len(comp_df) == 4
        assert metrics["ground_truth_distribution"]["comments_with_empty_demand_count"] == 2
        assert metrics["ground_truth_distribution"]["comments_with_demand_count"] == 2

        # Safeguard must have 0 hallucinations on the 2 empty records
        safeguard = metrics["performance_comparison"]["safeguarded_detector"]
        assert safeguard["unsupported_hallucinated_demands"] == 0
        assert safeguard["correctly_preserved_empty_demands"] == 2
        assert safeguard["precision"] == 1.0


class TestFlaggedReviewWorksheetIntegrity:
    """Ensure blank review worksheet adheres to annotation integrity requirements."""

    def test_worksheet_schema_and_blank_labels(self):
        """Review worksheet must exist with 22 rows, valid IDs, and strictly unpopulated human labels."""
        from pathlib import Path
        ws_path = Path("experiments/model_benchmark/human_review_worksheet_flagged_22.csv")
        assert ws_path.exists(), "Flagged review worksheet does not exist"

        df = pd.read_csv(ws_path)
        assert len(df) == 22, f"Expected 22 flagged comments, found {len(df)}"

        expected_columns = [
            "comment_id",
            "original_comment_text",
            "current_detector_decision",
            "current_confidence",
            "evidence_span",
            "human_reviewed_demand_presence_label",
            "reviewer_rationale",
            "adjudication_status",
        ]
        for col in expected_columns:
            assert col in df.columns, f"Missing required column: {col}"

        # Human label and rationale columns must be strictly blank (no auto-filled predictions)
        unfilled_labels = df["human_reviewed_demand_presence_label"].fillna("").str.strip() == ""
        assert unfilled_labels.all(), "Human labels must be completely blank in the review worksheet"

        unfilled_rationales = df["reviewer_rationale"].fillna("").str.strip() == ""
        assert unfilled_rationales.all(), "Reviewer rationales must be completely blank in the review worksheet"

        # Adjudication status must be PENDING_REVIEW
        assert (df["adjudication_status"] == "PENDING_REVIEW").all()

        # Comment IDs must be non-empty and unique
        assert df["comment_id"].nunique() == 22

    def test_flagged_evaluation_script_pending_mode(self):
        """Evaluating a blank worksheet must report PENDING_HUMAN_ADJUDICATION without failing."""
        from experiments.model_benchmark.evaluate_flagged_review import evaluate_adjudicated_worksheet
        from pathlib import Path

        df = pd.read_csv("experiments/model_benchmark/human_review_worksheet_flagged_22.csv")
        pilot_df = pd.read_csv("experiments/semantic_clustering/dataset/policylens_pilot_annotation_batch_50.csv")

        report = evaluate_adjudicated_worksheet(df, pilot_df=pilot_df)
        assert report["total_flagged_comments"] == 22
        assert report["adjudicated_comments_count"] == 0
        assert report["pending_review_count"] == 22
        assert report["status"] == "PENDING_HUMAN_ADJUDICATION"

    def test_flagged_evaluation_script_with_adjudicated_data(self):
        """Evaluating with supplied human labels must accurately report metrics and error analysis."""
        from experiments.model_benchmark.evaluate_flagged_review import evaluate_adjudicated_worksheet

        # Synthetic adjudicated worksheet
        synthetic_df = pd.DataFrame({
            "comment_id": ["TEST_FLAG_01", "TEST_FLAG_02", "TEST_FLAG_03"],
            "original_comment_text": [
                "Fix the Phoenix pay system immediately.",
                "Call centre agents only answered the phone about one-third of the time.",
                ".",
            ],
            "human_reviewed_demand_presence_label": [
                "EXPLICIT_DEMAND",
                "CONCERN_ONLY",
                "UNCLEAR_OR_INSUFFICIENT",
            ],
            "reviewer_rationale": [
                "Clear imperative 'Fix'",
                "Descriptive complaint about agent answer rate",
                "Single punctuation token without content",
            ],
            "adjudication_status": ["REVIEWED", "REVIEWED", "REVIEWED"],
        })

        report = evaluate_adjudicated_worksheet(synthetic_df)
        assert report["total_flagged_comments"] == 3
        assert report["adjudicated_comments_count"] == 3
        assert report["pending_review_count"] == 0
        assert "metrics" in report
        assert report["metrics"]["precision"] == 1.0
        assert report["metrics"]["false_positives_unsupported_actions_count"] == 0

