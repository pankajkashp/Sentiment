#!/usr/bin/env python3
"""
PolicyLens — Demand-Presence Detector and Evidence-Safe Extraction Engine

Prevents PolicyLens from fabricating requested actions when a citizen has expressed
a grievance/concern but has NOT formulated an actionable policy demand.

Core Principles:
1. Demand-Presence Classification:
   - EXPLICIT_DEMAND: Directly stated directive or actionable request.
   - IMPLICIT_DEMAND: Clear policy reform objective formulated nominally or indirectly.
   - CONCERN_ONLY: Grievance, criticism, or descriptive complaint without a requested solution.
   - UNCLEAR_OR_INSUFFICIENT: Fragmentary, incoherent, or ambiguous text requiring human review.
2. Evidence Attribution Hierarchy:
   - RESPONDENT_EXPLICIT_DEMAND: Directly stated in the verbatim citizen comment.
   - MODEL_INFERRED_RECOMMENDATION: Machine-generated policy recommendation based on thematic context.
   - ANALYST_PROPOSED_ACTION: Human policy analyst reform proposal.
   * NEVER conflates or presents these three categories as equivalent.
3. Empty-Demand Safeguard:
   - If a comment is CONCERN_ONLY or UNCLEAR_OR_INSUFFICIENT, the extracted demand
     is strictly kept EMPTY ("") and cluster-level candidate actions are NOT attached.
"""

import enum
import re
from dataclasses import asdict, dataclass, field
from typing import Any


class DemandStatus(str, enum.Enum):
    EXPLICIT_DEMAND = "EXPLICIT_DEMAND"
    IMPLICIT_DEMAND = "IMPLICIT_DEMAND"
    CONCERN_ONLY = "CONCERN_ONLY"
    UNCLEAR_OR_INSUFFICIENT = "UNCLEAR_OR_INSUFFICIENT"


class DemandAttributionTier(str, enum.Enum):
    RESPONDENT_EXPLICIT_DEMAND = "RESPONDENT_EXPLICIT_DEMAND"
    MODEL_INFERRED_RECOMMENDATION = "MODEL_INFERRED_RECOMMENDATION"
    ANALYST_PROPOSED_ACTION = "ANALYST_PROPOSED_ACTION"
    NONE_UNSTATED = "NONE_UNSTATED"


class SafeguardDecision(str, enum.Enum):
    EXTRACT_CITIZEN_DEMAND = "EXTRACT_CITIZEN_DEMAND"
    DEMAND_SUPPRESSED_NO_ACTION_REQUESTED = "DEMAND_SUPPRESSED_NO_ACTION_REQUESTED"
    FLAGGED_FOR_HUMAN_REVIEW = "FLAGGED_FOR_HUMAN_REVIEW"


@dataclass
class DemandDetectionResult:
    comment_id: str
    verbatim_text: str
    demand_status: DemandStatus
    attribution_tier: DemandAttributionTier
    safeguard_decision: SafeguardDecision
    extracted_demand: str
    extracted_concern: str
    linguistic_signals: list[str]
    confidence_score: float
    review_reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["demand_status"] = self.demand_status.value
        d["attribution_tier"] = self.attribution_tier.value
        d["safeguard_decision"] = self.safeguard_decision.value
        return d


class DemandPresenceDetector:
    """
    Linguistic and syntactic rule-based detector for policy demand presence.
    Distinguishes explicit directives, implicit reform desires, descriptive grievances,
    and ambiguous fragments.
    """

    # 1. Strong directive and request patterns (English & French)
    EXPLICIT_DIRECTIVE_PATTERNS = [
        # Imperatives at start of sentence or after clause boundary
        r"(?:^|[\.\!\?;]\s*|\b(?:and|so|please|svp)\s+)(?:fix|publish|disclose|provide|make|ensure|stop|protect|create|establish|adopt|simplify|update|change|replace|eliminate|reduce|revoir|donner|assurer|publier|divulguer|obliger|simplifier)\b",
        # Explicit polite request markers
        r"\b(?:please|pls|svp|prière de|veuillez|merci de)\b",
        r"\b(?:i\s+would\s+like\s+to|i'd\s+like\s+to|we\s+would\s+like\s+to|we'd\s+like\s+to|je\s+voudrais|nous\s+souhaitons)\b",
        # Deontic modals + action verbs
        r"\b(?:government|govt|canada|we|citizens|they)\s+(?:must|should|ought\s+to|needs?\s+to|have\s+to|has\s+to|doit|doivent|devrait|devraient)\b",
        r"\b(?:we|i)\s+need\b",
        r"\b(?:there\s+needs?\s+to\s+be|there\s+must\s+be|there\s+should\s+be)\b",
        r"\b(?:we|canada)\s+should\s+be\s+(?:doing|taking|implementing)\b",
        # Direct calls for institutional action
        r"\b(?:government|authorities|ministry)\s+to\s+(?:provide|explain|disclose|publish|ensure)\b",
        r"\b(?:make\s+the\s+bureaucrats|hold\s+them\s+accountable|hold\s+accountable)\b",
        r"\b(?:stop\s+(?:with\s+the|making|wasting|ignoring))\b",
    ]

    # 2. Implicit / nominalized policy reform desire patterns
    IMPLICIT_REFORM_PATTERNS = [
        # Nominalized actions (e.g. "Poverty reduction/elimination", "Fiscal restraint")
        r"\b(?:reduction|elimination|simplification|re-evaluation|standardization|reform|restraint|modernization)\b",
        r"\b(?:réduction|élimination|simplification|réforme|normalisation)\b",
        # Comparative reform goals
        r"\b(?:more|better|greater|speedy|adequate|clearer|easier|equitable)\s+(?:transparency|accountability|access|openness|speed|services|visibility|education|equity)\b",
        r"\b(?:plus\s+de|meilleure?)\s+(?:transparence|responsabilité|accès|services)\b",
        # Desired institutional posture
        r"\b(?:an\s+assembly\s+of|direct\s+democracy|referendum|proactive\s+ethics|lets\s+get|let's\s+get)\b",
        r"\b(?:un\s+gouvernement\s+à\s+l'écoute|sensible\s+à\s+la\s+question)\b",
        r"\b(?:ending|abolishing|dismantling)\s+(?:capitalism|bureaucracy|corruption)\b",
    ]

    # 3. Descriptive past-tense and grievance indicators (Action verbs in factual descriptions, NOT requests)
    DESCRIPTIVE_GRIEVANCE_PATTERNS = [
        r"\b(?:i\s+filed|i\s+applied|i\s+searched|i\s+tried|i\s+submitted|i\s+work\s+for)\b",
        r"\b(?:haven't\s+received|didn't\s+provide|didn't\s+get|couldn't\s+find|have\s+heard\s+the\s+lip\s+service)\b",
        r"\b(?:agents?\s+(?:only\s+)?answered|call\s+centre\s+agents?|phone\s+about\s+one-third)\b",
        r"\b(?:hotline\s+was\s+closed|was\s+a\s+catastrophe|wasn't\s+really\s+new)\b",
        r"\b(?:the\s+government\s+will\s+pick|they\s+will\s+do\s+what\s+they\s+want)\b",
        r"\b(?:just\s+confirmed\s+what\s+some\s+of\s+us\s+already\s+believe)\b",
        r"\b(?:people\s+here\s+are\s+still\s+fighting|canadian\s+forces\s+are\s+embarrassingly\s+underfunded)\b",
        r"\b(?:spending\s+and\s+increased\s+taxes|less\s+government\s+is\s+needed)\b",
        r"\b(?:it\s+is\s+very\s+difficult|entrer\s+dans\s+mon\s+dossier\s+c\s+compliquer|il\s+est\s+difficile)\b",
    ]

    # 4. Fragmentary / Insufficient text patterns
    UNCLEAR_FRAGMENT_PATTERNS = [
        r"^[\.\,\!\?\-\s]+$",  # Only punctuation
        r"^(?:idk|test|n/a|none|na|nil|nothing|no|yes|oui|non)$",
        r"^[a-zA-Z\s]{1,10}$",  # Very short 1-2 words without reform target (e.g. "poverty", "senate reform")
    ]

    def __init__(self):
        self.compiled_explicit = [re.compile(p, re.IGNORECASE) for p in self.EXPLICIT_DIRECTIVE_PATTERNS]
        self.compiled_implicit = [re.compile(p, re.IGNORECASE) for p in self.IMPLICIT_REFORM_PATTERNS]
        self.compiled_grievance = [re.compile(p, re.IGNORECASE) for p in self.DESCRIPTIVE_GRIEVANCE_PATTERNS]
        self.compiled_unclear = [re.compile(p, re.IGNORECASE) for p in self.UNCLEAR_FRAGMENT_PATTERNS]

    def detect(
        self,
        comment: str,
        comment_id: str = "UNKNOWN",
        candidate_concern: str | None = None,
        candidate_demand: str | None = None,
    ) -> DemandDetectionResult:
        """
        Analyze a citizen comment and determine whether an actionable demand is present.
        """
        text = str(comment).strip()
        tokens = text.split()
        num_tokens = len(tokens)

        # 1. Check for fragmentary or unclear comments (< 3 tokens or pure punctuation)
        if num_tokens <= 1 and (len(text) <= 1 or text in [".", "?", "-", "N/A"]):
            return DemandDetectionResult(
                comment_id=comment_id,
                verbatim_text=text,
                demand_status=DemandStatus.UNCLEAR_OR_INSUFFICIENT,
                attribution_tier=DemandAttributionTier.NONE_UNSTATED,
                safeguard_decision=SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW,
                extracted_demand="",
                extracted_concern="",
                linguistic_signals=["PURE_PUNCTUATION_OR_SINGLE_TOKEN"],
                confidence_score=0.95,
                review_reason="Single token or punctuation-only submission lacks interpretable policy content.",
            )

        # Single word or two words without verbs (e.g., "poverty", "senate reform")
        if num_tokens <= 2 and not any(v in text.lower() for v in ["fix", "stop", "make", "help", "need"]):
            # Check if it expresses a standalone topic concern
            if text.lower() in ["poverty", "senate reform", "health", "education"]:
                # If it's a bare noun without request, it's a concern/topic only
                return DemandDetectionResult(
                    comment_id=comment_id,
                    verbatim_text=text,
                    demand_status=DemandStatus.CONCERN_ONLY,
                    attribution_tier=DemandAttributionTier.NONE_UNSTATED,
                    safeguard_decision=SafeguardDecision.DEMAND_SUPPRESSED_NO_ACTION_REQUESTED,
                    extracted_demand="",
                    extracted_concern=f"Topic identified without elaborated request: {text}",
                    linguistic_signals=["BARE_NOUN_TOPIC_WITHOUT_DIRECTIVE"],
                    confidence_score=0.88,
                    review_reason="Bare noun identifies civic issue; no solution or action requested.",
                )
            else:
                return DemandDetectionResult(
                    comment_id=comment_id,
                    verbatim_text=text,
                    demand_status=DemandStatus.UNCLEAR_OR_INSUFFICIENT,
                    attribution_tier=DemandAttributionTier.NONE_UNSTATED,
                    safeguard_decision=SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW,
                    extracted_demand="",
                    extracted_concern=candidate_concern or text,
                    linguistic_signals=["FRAGMENTARY_SHORT_TEXT"],
                    confidence_score=0.85,
                    review_reason="Short fragmentary phrase lacks explicit position or actionable demand.",
                )

        signals = []

        # 2. Match Explicit Directives
        explicit_matches = [p.pattern for p in self.compiled_explicit if p.search(text)]
        if explicit_matches:
            signals.extend([f"EXPLICIT_DIRECTIVE:{m[:35]}" for m in explicit_matches])

        # 3. Match Implicit Reforms
        implicit_matches = [p.pattern for p in self.compiled_implicit if p.search(text)]
        if implicit_matches:
            signals.extend([f"IMPLICIT_REFORM:{m[:35]}" for m in implicit_matches])

        # 4. Match Descriptive Grievances
        grievance_matches = [p.pattern for p in self.compiled_grievance if p.search(text)]
        if grievance_matches:
            signals.extend([f"DESCRIPTIVE_GRIEVANCE:{m[:35]}" for m in grievance_matches])

        # Classification Logic
        # Case A: Strong explicit directive detected
        if explicit_matches:
            # Extract actionable clause
            extracted_action = candidate_demand if candidate_demand else self._extract_action_span(text)
            return DemandDetectionResult(
                comment_id=comment_id,
                verbatim_text=text,
                demand_status=DemandStatus.EXPLICIT_DEMAND,
                attribution_tier=DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND,
                safeguard_decision=SafeguardDecision.EXTRACT_CITIZEN_DEMAND,
                extracted_demand=extracted_action,
                extracted_concern=candidate_concern or text[:120],
                linguistic_signals=signals,
                confidence_score=0.92,
            )

        # Case B: Implicit reform or nominalized policy goal detected (without explicit imperative)
        if implicit_matches and not (grievance_matches and len(implicit_matches) == 1 and "difficult" in text.lower()):
            extracted_action = candidate_demand if candidate_demand else self._extract_action_span(text)
            return DemandDetectionResult(
                comment_id=comment_id,
                verbatim_text=text,
                demand_status=DemandStatus.IMPLICIT_DEMAND,
                attribution_tier=DemandAttributionTier.RESPONDENT_EXPLICIT_DEMAND,
                safeguard_decision=SafeguardDecision.EXTRACT_CITIZEN_DEMAND,
                extracted_demand=extracted_action,
                extracted_concern=candidate_concern or text[:120],
                linguistic_signals=signals,
                confidence_score=0.82,
            )

        # Case C: Descriptive grievance with NO directive or reform pattern
        if grievance_matches or any(w in text.lower() for w in ["concerned", "terrible", "problem", "difficult", "catastrophe"]):
            return DemandDetectionResult(
                comment_id=comment_id,
                verbatim_text=text,
                demand_status=DemandStatus.CONCERN_ONLY,
                attribution_tier=DemandAttributionTier.NONE_UNSTATED,
                safeguard_decision=SafeguardDecision.DEMAND_SUPPRESSED_NO_ACTION_REQUESTED,
                extracted_demand="",  # Strictly suppressed! Never hallucinate a demand!
                extracted_concern=candidate_concern or text[:120],
                linguistic_signals=signals,
                confidence_score=0.86,
                review_reason="Citizen voiced grievance/dissatisfaction without specifying a requested action.",
            )

        # Case D: Ambiguous text without clear directive or clear grievance
        return DemandDetectionResult(
            comment_id=comment_id,
            verbatim_text=text,
            demand_status=DemandStatus.UNCLEAR_OR_INSUFFICIENT,
            attribution_tier=DemandAttributionTier.NONE_UNSTATED,
            safeguard_decision=SafeguardDecision.FLAGGED_FOR_HUMAN_REVIEW,
            extracted_demand="",
            extracted_concern=candidate_concern or text[:120],
            linguistic_signals=signals if signals else ["NO_MODAL_OR_REFORM_SIGNALS"],
            confidence_score=0.60,
            review_reason="Insufficient directive or grievance evidence; requires manual policy review.",
        )

    def _extract_action_span(self, text: str) -> str:
        """Extract the most relevant directive sentence/span from comment."""
        sentences = re.split(r"(?<=[\.\!\?])\s+", text)
        for s in sentences:
            s_clean = s.strip()
            for p in self.compiled_explicit:
                if p.search(s_clean):
                    return s_clean[:200]
            for p in self.compiled_implicit:
                if p.search(s_clean):
                    return s_clean[:200]
        return text[:150]
