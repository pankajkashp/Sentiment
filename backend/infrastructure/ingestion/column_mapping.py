"""
PolicyLens — Column Mapping Layer
==================================
Provides a configurable, versioned mapping from raw CSV column headers
(which contain bilingual text, newlines, trailing spaces) to clean
semantic field names used throughout the application.

Design decisions:
- All column name normalization happens HERE and ONLY here.
- The rest of the application uses semantic names (ColumnMap keys).
- Adding a new dataset requires only adding a new ColumnMap entry.
- No raw CSV column names leak into business logic.

Usage:
    from backend.infrastructure.ingestion.column_mapping import get_column_map
    col_map = get_column_map("ap2016-18")
    df = df.rename(columns=col_map.raw_to_semantic)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import json
from pathlib import Path


@dataclass(frozen=True)
class ColumnDefinition:
    """Describes a single column's mapping and role."""
    raw_name: str                        # Exact header string in the CSV (English in multi-row)
    semantic_name: str                   # Clean name used in application
    role: str                            # 'text', 'metadata', 'numeric', 'code', 'id', 'timestamp', 'empty_prompt', 'administrative'
    language: Optional[str]             # 'en', 'fr', 'both', None
    primary_text_candidate: bool = False # True if this column is a primary NLP target
    required: bool = False               # True if missing this column is a fatal error
    retained_in_curated: bool = False    # True if column is retained in curated processed dataset
    raw_name_fr: Optional[str] = None    # French header string if available
    notes: str = ""


@dataclass
class ColumnMap:
    """
    Holds the full column mapping for a specific dataset version.
    Provides bidirectional lookup and validation utilities.
    """
    dataset_id: str
    version: str
    encoding: str
    definitions: List[ColumnDefinition]
    header_row: int = 0                  # 0 for single header; 1 for French(0)+English(1) multi-row header

    @property
    def raw_to_semantic(self) -> Dict[str, str]:
        """Dict suitable for pd.DataFrame.rename(columns=...)."""
        return {d.raw_name: d.semantic_name for d in self.definitions}

    @property
    def semantic_to_raw(self) -> Dict[str, str]:
        return {d.semantic_name: d.raw_name for d in self.definitions}

    @property
    def primary_text_columns(self) -> List[str]:
        """Semantic names of primary NLP text columns."""
        return [d.semantic_name for d in self.definitions if d.primary_text_candidate]

    @property
    def all_text_columns(self) -> List[str]:
        """Semantic names of all text columns."""
        return [d.semantic_name for d in self.definitions if d.role == "text"]

    @property
    def curated_columns(self) -> List[str]:
        """Semantic names of columns retained in curated processed dataset."""
        return [d.semantic_name for d in self.definitions if d.retained_in_curated]

    @property
    def required_columns(self) -> List[str]:
        """Raw names of columns that must exist in the CSV."""
        return [d.raw_name for d in self.definitions if d.required]

    def validate_dataframe(self, df_columns: List[str]) -> List[str]:
        """
        Returns a list of validation error messages.
        Empty list means the DataFrame is compatible with this map.
        """
        errors: List[str] = []
        present = set(df_columns)
        for raw_name in self.required_columns:
            if raw_name not in present:
                errors.append(f"Required column missing: {repr(raw_name)}")
        return errors


# ---------------------------------------------------------------------------
# Dataset: ap2016-18_individual_comments
# ---------------------------------------------------------------------------
#
# IMPORTANT: The raw column headers contain newlines, trailing spaces, and
# accented French characters. This mapping is the ONLY place that handles them.
# ---------------------------------------------------------------------------

AP2016_18_COLUMNS: List[ColumnDefinition] = [
    ColumnDefinition(
        raw_name="Row\nRangée",
        semantic_name="row_id",
        role="id",
        language=None,
        required=False,
        notes="Numeric row identifier. 14 nulls. Not a reliable primary key — use DataFrame index.",
    ),
    ColumnDefinition(
        raw_name="Event",
        semantic_name="event_name_en",
        role="metadata",
        language="en",
        required=False,
        notes="Engagement event name (English). 8 unique values.",
    ),
    ColumnDefinition(
        raw_name="Événement",
        semantic_name="event_name_fr",
        role="metadata",
        language="fr",
        notes="Engagement event name (French).",
    ),
    ColumnDefinition(
        raw_name="Source\n",
        semantic_name="source_type_en",
        role="metadata",
        language="en",
        notes="Source type (English). Trailing newline in raw header.",
    ),
    ColumnDefinition(
        raw_name="Source ",
        semantic_name="source_type_fr",
        role="metadata",
        language="fr",
        notes="Source type (French). Trailing space in raw header.",
    ),
    ColumnDefinition(
        raw_name="Source Language",
        semantic_name="source_language",
        role="metadata",
        language=None,
        required=True,
        notes="Original response language. Known anomaly: value 'S' appears once (likely entry error).",
    ),
    ColumnDefinition(
        raw_name="Langue de départ",
        semantic_name="source_language_fr",
        role="metadata",
        language="fr",
        notes="Original response language (French label).",
    ),
    ColumnDefinition(
        raw_name="Sector",
        semantic_name="stakeholder_sector_en",
        role="metadata",
        language="en",
        notes="Stakeholder sector (English). 10 categories. 18 nulls.",
    ),
    ColumnDefinition(
        raw_name="Secteur",
        semantic_name="stakeholder_sector_fr",
        role="metadata",
        language="fr",
        notes="Stakeholder sector (French). 11 categories. 20 nulls. Slight discrepancy vs EN column.",
    ),
    ColumnDefinition(
        raw_name=(
            "Public Engagement Question (Also in Compilation)\n"
            "Question sur la mobilisation du "
        ),
        semantic_name="engagement_question",
        role="text",
        language="both",
        primary_text_candidate=True,
        notes="Free-text answer to the public engagement question. 112 non-null. Primary analysis candidate.",
    ),
    ColumnDefinition(
        raw_name=(
            "1 Practical idea (Also in Compilation)\n"
            "Une idée pratique (Toujours dans Compilation)"
        ),
        semantic_name="practical_idea",
        role="text",
        language="both",
        primary_text_candidate=True,
        notes="Free-text: one practical idea. 125 non-null. PRIMARY demand extraction candidate.",
    ),
    ColumnDefinition(
        raw_name="3 words\n3 mots",
        semantic_name="three_words",
        role="text",
        language="both",
        notes="3-word descriptor. 117 non-null. Supplementary keyword signal.",
    ),
    ColumnDefinition(
        raw_name=(
            "OG is important because\n"
            "Il est important d\u2019avoir un gouvernement ouvert parce que "
        ),
        semantic_name="og_importance",
        role="text",
        language="both",
        primary_text_candidate=True,
        notes="Free-text: why open government matters. 123 non-null. Concern/value extraction candidate.",
    ),
    ColumnDefinition(
        raw_name=(
            "Preferred way(s) to participate in Open Government\n"
            "Façons préférées de participer au Gouvernement ouvert "
        ),
        semantic_name="participation_preference_codes",
        role="code",
        language=None,
        notes=(
            "Numeric codes referencing a participation method codebook. "
            "WARNING: Codebook NOT included in dataset. Cannot interpret without it."
        ),
    ),
    ColumnDefinition(
        raw_name="What did you like most?\nCe que vous avez le plus aimé ?",
        semantic_name="liked_most",
        role="text",
        language="both",
        notes="Free-text: what participants liked. 113 non-null.",
    ),
    ColumnDefinition(
        raw_name="Dislike?\nCe que vous avez moins aimé ?",
        semantic_name="disliked",
        role="text",
        language="both",
        notes="Free-text: what participants disliked. 60 non-null (62.5% missing). Interpret with caution.",
    ),
    ColumnDefinition(
        raw_name="Improvements? \nAméliorations",
        semantic_name="improvements",
        role="text",
        language="both",
        primary_text_candidate=True,
        notes="Free-text: suggested improvements. 84 non-null. Secondary demand extraction candidate.",
    ),
    ColumnDefinition(
        raw_name="Would you recommend?\nRecommanderiez-vous ",
        semantic_name="recommendation_score",
        role="numeric",
        language=None,
        notes="NPS-style numeric score 5–10. 107 non-null. 53 missing.",
    ),
    ColumnDefinition(
        raw_name="Other comments\nAutres commentaires",
        semantic_name="other_comments",
        role="text",
        language="both",
        notes="Free-text catch-all. 32 non-null (80% missing). Supplementary signal only.",
    ),
]

AP2016_18_MAP = ColumnMap(
    dataset_id="ap2016-18_individual_comments",
    version="1.0.0",
    encoding="Windows-1252",
    definitions=AP2016_18_COLUMNS,
)


# ---------------------------------------------------------------------------
# Dataset: Open Government Consultation 2017-18 Questionnaire
# ---------------------------------------------------------------------------

OG2017_18_QUESTIONNAIRE_COLUMNS: List[ColumnDefinition] = [
    ColumnDefinition(
        raw_name='Unique Identifier',
        semantic_name="respondent_id",
        role="id",
        language=None,
        required=True,
        retained_in_curated=True,
        raw_name_fr='\nIdentifiant unique',
        notes='Unique respondent identifier (12-digit integer). 8212 unique values. 0 nulls.',
    ),
    ColumnDefinition(
        raw_name='Language',
        semantic_name="language",
        role="metadata",
        language="both",
        required=True,
        retained_in_curated=True,
        raw_name_fr='\nLa langue',
        notes='Survey interface language: English / Anglais (6803) or French / français (1409).',
    ),
    ColumnDefinition(
        raw_name='Start Date',
        semantic_name="start_date",
        role="timestamp",
        language=None,
        retained_in_curated=True,
        raw_name_fr='\nDate de début',
        notes='Timestamp when questionnaire was started.',
    ),
    ColumnDefinition(
        raw_name='End Date',
        semantic_name="end_date",
        role="timestamp",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Date de fin',
        notes='Timestamp when questionnaire was completed.',
    ),
    ColumnDefinition(
        raw_name='Q1. Is transparency an important issue for you?',
        semantic_name="q1_transparency_important",
        role="numeric",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q1. Est-ce que la transparence est un élément important pour vous?',
        notes='Q1: Is transparency important? 1=Yes (7880), 2=No (331), 1 null.',
    ),
    ColumnDefinition(
        raw_name='Q2. What are your three most important government transparency topics?',
        semantic_name="q2_transparency_topics_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q2. Quels sont les trois domaines de la transparence du gouvernement les plus importants pour vous?',
        notes='Question prompt header for Q2. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Being able to find the person in government I need to talk to.',
        semantic_name="q2r_find_person",
        role="code",
        language=None,
        raw_name_fr='Q2R. Être en mesure de trouver la personne à qui je dois parler dans le gouvernement.',
        notes='Q2 checkbox option 1: Being able to find the person in government to talk to.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Learning about government policies and programs.',
        semantic_name="q2r_policies_programs",
        role="code",
        language=None,
        raw_name_fr='Q2R. S’informer sur les politiques et les programmes du gouvernement.',
        notes='Q2 checkbox option 2: Learning about government policies and programs.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Being able to request and get documents about government operations or decisions easily.',
        semantic_name="q2r_request_documents",
        role="code",
        language=None,
        raw_name_fr='Q2R. Être en mesure de demander et d’obtenir facilement des documents sur les activités ou les décisions gouvernementales.',
        notes='Q2 checkbox option 3: Being able to request and get documents easily.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Learning about the work of government officials.',
        semantic_name="q2r_work_of_officials",
        role="code",
        language=None,
        raw_name_fr='Q2R. S’informer sur le travail des représentants du gouvernement.',
        notes='Q2 checkbox option 4: Learning about the work of government officials.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Being able to find out about government spending.',
        semantic_name="q2r_spending",
        role="code",
        language=None,
        raw_name_fr='Q2R. Être en mesure de se renseigner sur les dépenses gouvernementales.',
        notes='Q2 checkbox option 5: Being able to find out about government spending.',
    ),
    ColumnDefinition(
        raw_name='Q2R. As much as possible, having access to the same data as government.',
        semantic_name="q2r_same_data_as_gov",
        role="code",
        language=None,
        raw_name_fr='Q2R. Avoir accès autant que possible aux mêmes données que le gouvernement.',
        notes='Q2 checkbox option 6: Having access to the same data as government.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Viewing information on everyday government business like spending on hospitality or job reclassifications (also known as Proactive Disclosure).',
        semantic_name="q2r_proactive_disclosure",
        role="code",
        language=None,
        raw_name_fr='Q2R. Visualiser l’information de tous les jours sur tous les affaires du gouvernement comme les dépenses des frais de voyage et d’accueil ou de reclassification d’emploi (aussi appelée la divulgation proactive).',
        notes='Q2 checkbox option 7: Viewing information on proactive disclosure.',
    ),
    ColumnDefinition(
        raw_name='Q2R. The Canadian Government working with other governments (state, municipal, provincial, territorial or international) to help them be more open.',
        semantic_name="q2r_working_with_other_govs",
        role="code",
        language=None,
        raw_name_fr='Q2R. Le gouvernement canadien collabore avec d’autres gouvernements (états, municipalités, territoires ou pays étrangers) afin de les aider à devenir plus ouverts.',
        notes='Q2 checkbox option 8: Gov working with other governments.',
    ),
    ColumnDefinition(
        raw_name='Q2R. Other (please specify)',
        semantic_name="text_q2r_other_transparency",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q2R. Autre, veuillez préciser',
        notes='Q2 free-text other: Citizens specifying additional transparency priorities (558 comments).',
    ),
    ColumnDefinition(
        raw_name='Q3. Is government accountability an important issue for you?',
        semantic_name="q3_accountability_important",
        role="numeric",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q3. Est-ce que la responsabilisation gouvernementale est un élément important pour vous?',
        notes='Q3: Is accountability important? 1=Yes (8019), 2=No (192), 1 null.',
    ),
    ColumnDefinition(
        raw_name='Q4. What are your three most important government accountability needs?',
        semantic_name="q4_accountability_needs_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q4. Quels sont vos principaux besoins en matière de la responsabilisation du gouvernement?',
        notes='Question prompt header for Q4. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Keeping an eye on government spending and potential conflicts of interest.',
        semantic_name="q4r_track_spending_conflicts",
        role="code",
        language=None,
        raw_name_fr='Q4R. Garder un œil sur les dépenses gouvernementales et les potentiels conflits d’intérêts.',
        notes='Q4 checkbox option 1: Keeping an eye on spending and conflicts of interest.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Understanding who seeks to influence government decision making (e.g. through lobbying).',
        semantic_name="q4r_influence_decision_making",
        role="code",
        language=None,
        raw_name_fr='Q4R. Comprendre qui cherche à influencer la prise de décision au sein du gouvernement (p. ex., au moyen du lobbying).',
        notes='Q4 checkbox option 2: Understanding lobbying / decision influence.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Having the information available to hold government accountable.',
        semantic_name="q4r_holding_gov_accountable",
        role="code",
        language=None,
        raw_name_fr='Q4R. Avoir les renseignements disponibles pour tenir le gouvernement responsable.',
        notes='Q4 checkbox option 3: Having info to hold government accountable.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Being able to track progress on government’s commitments.',
        semantic_name="q4r_track_commitments",
        role="code",
        language=None,
        raw_name_fr='Q4R. Être en mesure de suivre les progrès en ce qui concerne les engagements du gouvernement.',
        notes='Q4 checkbox option 4: Tracking progress on commitments.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Strengthening privacy and data protection for Canadians.',
        semantic_name="q4r_privacy_data_protection",
        role="code",
        language=None,
        raw_name_fr='Q4R. Renforcer la protection des renseignements personnels et des données pour les Canadiens.',
        notes='Q4 checkbox option 5: Strengthening privacy and data protection.',
    ),
    ColumnDefinition(
        raw_name='Q4R. Other (please specify)6',
        semantic_name="text_q4r_other_accountability",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q4R. Autre, veuillez préciser',
        notes='Q4 free-text other: Citizens specifying additional accountability needs (454 comments).',
    ),
    ColumnDefinition(
        raw_name='Q5. Is citizen participation in government an important issue for you',
        semantic_name="q5_participation_important",
        role="numeric",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q5. Est-ce que la participation citoyenne au sein du gouvernement est un élément important pour vous?',
        notes='Q5: Is citizen participation important? 1=Yes (7380), 2=No (831), 1 null.',
    ),
    ColumnDefinition(
        raw_name='Q6. What are the three most important ways to participate and interact with government?',
        semantic_name="q6_participation_ways_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q6. Quels sont les principaux moyens de participer et d’interagir avec le gouvernement?\xa0\xa0',
        notes='Question prompt header for Q6. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being given an opportunity to provide my views and concerns to government.',
        semantic_name="q6r_provide_views_concerns",
        role="code",
        language=None,
        raw_name_fr='Q6R. Avoir la possibilité de présenter mes points de vue et mes préoccupations au gouvernement.',
        notes='Q6 checkbox option 1: Opportunity to provide views and concerns.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being able to provide input into government decision making.',
        semantic_name="q6r_input_decision_making",
        role="code",
        language=None,
        raw_name_fr='Q6R.  Être en mesure de contribuer à la prise de décision au sein du gouvernement.',
        notes='Q6 checkbox option 2: Input into decision making.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being able to interact with other Canadians on issues of shared concern.',
        semantic_name="q6r_interact_other_canadians",
        role="code",
        language=None,
        raw_name_fr='Q6R. Être en mesure d’interagir avec d’autres Canadiens sur des questions faisant l’objet de préoccupations communes.',
        notes='Q6 checkbox option 3: Interacting with other Canadians on shared concerns.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being able to collaborate directly with government on issues I care about.',
        semantic_name="q6r_collaborate_directly",
        role="code",
        language=None,
        raw_name_fr='Q6R.  Être en mesure de collaborer directement avec le gouvernement sur des questions importantes pour moi.',
        notes='Q6 checkbox option 4: Collaborating directly with government.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Simplifying my interaction with government by allowing government departments to share my information with each other.',
        semantic_name="q6r_share_info_across_depts",
        role="code",
        language=None,
        raw_name_fr='Q6R. Permettre aux ministères de partager mes informations (de sorte que je ne doive fournir mes renseignements qu’une seule fois).',
        notes='Q6 checkbox option 5: Departments sharing information.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being able to make suggestions on improving government services.',
        semantic_name="q6r_suggest_service_improvements",
        role="code",
        language=None,
        raw_name_fr='Q6R. Être en mesure d’offrir des suggestions pour améliorer les services gouvernementaux.',
        notes='Q6 checkbox option 6: Making suggestions to improve services.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Being able to track the status of my data/information request or suggestion.',
        semantic_name="q6r_track_request_status",
        role="code",
        language=None,
        raw_name_fr='Q6R. Être en mesure de suivre l’état de mes suggestions ou de mes demandes d’accès à l’information ou aux données.',
        notes='Q6 checkbox option 7: Tracking request or suggestion status.',
    ),
    ColumnDefinition(
        raw_name='Q6R. Other (please specify)',
        semantic_name="text_q6r_other_participation",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q6R. Autre, veuillez préciser',
        notes='Q6 free-text other: Citizens specifying additional participation modalities (279 comments).',
    ),
    ColumnDefinition(
        raw_name='Q7. The federal government works to improve the 16 strategic outcomes listed below. What are the three most important outcomes to be included in Canada’s 4th Plan on Open Government?',
        semantic_name="q7_strategic_outcomes_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q7. Le gouvernement fédéral travaille à l’amélioration des 16 résultats stratégiques indiqués ci-dessous. Quels sont les trois plus importants résultats qui devraient être inclus dans le 4e Plan du Canada pour un gouvernement ouvert?',
        notes='Question prompt header for Q7. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Income security and employment',
        semantic_name="q7r_income_security_employment",
        role="code",
        language=None,
        raw_name_fr='Q7R. La sécurité du revenu et l’emploi.',
        notes='Q7 outcome 1: Income security and employment.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Economic growth',
        semantic_name="q7r_economic_growth",
        role="code",
        language=None,
        raw_name_fr='Q7R. La croissance économique.',
        notes='Q7 outcome 2: Economic growth.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Innovation and knowledge based economy',
        semantic_name="q7r_innovation_knowledge_economy",
        role="code",
        language=None,
        raw_name_fr='Q7R. Une économie fondée sur l’innovation et les connaissances.',
        notes='Q7 outcome 3: Innovation and knowledge based economy.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Clean and healthy environment',
        semantic_name="q7r_clean_healthy_environment",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un environnement propre et sain.',
        notes='Q7 outcome 4: Clean and healthy environment.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Fair and secure workplace',
        semantic_name="q7r_fair_secure_workplace",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un milieu de travail équitable et sécuritaire.',
        notes='Q7 outcome 5: Fair and secure workplace.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Healthy Canadians',
        semantic_name="q7r_healthy_canadians",
        role="code",
        language=None,
        raw_name_fr='Q7R. Des Canadiens en bonne santé.',
        notes='Q7 outcome 6: Healthy Canadians.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Safe and secure Canada',
        semantic_name="q7r_safe_secure_canada",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un Canada sécuritaire.',
        notes='Q7 outcome 7: Safe and secure Canada.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Diverse society that promotes linguistic duality and social inclusion',
        semantic_name="q7r_diverse_inclusive_society",
        role="code",
        language=None,
        raw_name_fr='Q7R. Une société diversifiée favorable à la dualité linguistique et à l’inclusion sociale.',
        notes='Q7 outcome 8: Diverse society, linguistic duality, social inclusion.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Vibrant Canadian culture and heritage',
        semantic_name="q7r_culture_heritage",
        role="code",
        language=None,
        raw_name_fr='Q7R. Une culture et un patrimoine canadiens dynamiques.',
        notes='Q7 outcome 9: Vibrant Canadian culture and heritage.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Safe and secure world through international engagement',
        semantic_name="q7r_safe_secure_world",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un monde sécuritaire grâce à la mobilisation internationale.',
        notes='Q7 outcome 10: Safe and secure world through international engagement.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Global poverty reduction through sustainable development',
        semantic_name="q7r_global_poverty_reduction",
        role="code",
        language=None,
        raw_name_fr='Q7R. La réduction de la pauvreté à l’échelle mondiale grâce au développement durable.',
        notes='Q7 outcome 11: Global poverty reduction through sustainable development.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Strong and mutually beneficial North American partnership',
        semantic_name="q7r_na_partnership",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un partenariat nord-américain solide et mutuellement avantageux.',
        notes='Q7 outcome 12: Strong and mutually beneficial North American partnership.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Prosperous Canada through global commerce',
        semantic_name="q7r_global_commerce",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un Canada prospère grâce au commerce mondial.',
        notes='Q7 outcome 13: Prosperous Canada through global commerce.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Strong and independent democratic institutions',
        semantic_name="q7r_democratic_institutions",
        role="code",
        language=None,
        raw_name_fr='Q7R. Des institutions démocratiques solides et indépendantes.',
        notes='Q7 outcome 14: Strong and independent democratic institutions.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Transparent, accountable and responsive Federal government',
        semantic_name="q7r_open_accountable_gov",
        role="code",
        language=None,
        raw_name_fr='Q7R. Un gouvernement fédéral transparent, responsable et réactif.',
        notes='Q7 outcome 15: Transparent, accountable and responsive Federal government.',
    ),
    ColumnDefinition(
        raw_name='Q7R. Well managed and efficient government operations',
        semantic_name="q7r_efficient_operations",
        role="code",
        language=None,
        raw_name_fr='Q7R. Des activités gouvernementales bien gérées et efficaces.',
        notes='Q7 outcome 16: Well managed and efficient government operations.',
    ),
    ColumnDefinition(
        raw_name='Q8. Did we miss anything? If the previous questions did not speak to you, please tell us about the important aspects of open government that drive your interest: \xa0 If you have more than one additional item, please list them in priority.',
        semantic_name="text_q8_missed_topics",
        role="text",
        language="both",
        primary_text_candidate=True,
        retained_in_curated=True,
        raw_name_fr='Q8. Avons-nous omis quelque chose?\xa0 Si les questions précédentes ne vous ont pas interpellé, veuillez nous indiquer quels aspects essentiels du gouvernement ouvert vous intéressent\xa0:Si vous avez plus d’un point supplémentaire, veuillez les indiquer dans l’ordre de leur priorité.',
        notes='Q8 free-text: Important aspects of open government driving citizen interest / missed issues. Primary NLP target (2196 comments).',
    ),
    ColumnDefinition(
        raw_name='Q9. Which statements best describe your interest in open government? Check all that apply.',
        semantic_name="q9_interest_reasons_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q9. Laquelle des déclarations suivantes décrit le mieux votre intérêt concernant le gouvernement ouvert?',
        notes='Question prompt header for Q9. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I’m new to open government and curious',
        semantic_name="q9r_new_curious",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je ne connais pas le gouvernement ouvert et cela suscite ma curiosité.',
        notes='Q9 reason 1: New to open government and curious.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I’m interested in learning more and maybe getting involved',
        semantic_name="q9r_learn_more",
        role="code",
        language=None,
        raw_name_fr='Q9R. J’aimerais en apprendre davantage et éventuellement participer.',
        notes='Q9 reason 2: Interested in learning more and getting involved.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I like to make web applications and explore how things work technically',
        semantic_name="q9r_web_apps_technical",
        role="code",
        language=None,
        raw_name_fr='Q9R. J’aime créer des applications Web et étudier le fonctionnement technique des choses.',
        notes='Q9 reason 3: Like to make web apps and explore technically.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I like to sift through data and information to find answers and insights',
        semantic_name="q9r_sift_data_insights",
        role="code",
        language=None,
        raw_name_fr='Q9R. J’aime trier les données et les renseignements pour trouver des réponses et des idées.',
        notes='Q9 reason 4: Like to sift through data for insights.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I am looking for opportunities to use open data to start a new business',
        semantic_name="q9r_start_business",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je cherche des occasions d’utiliser les données ouvertes pour lancer une nouvelle entreprise.',
        notes='Q9 reason 5: Open data to start new business.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I am looking for opportunities to enhance an existing business',
        semantic_name="q9r_enhance_business",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je cherche des occasions de développer une entreprise existante.',
        notes='Q9 reason 6: Open data to enhance existing business.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I am looking for opportunities to make society better',
        semantic_name="q9r_make_society_better",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je cherche des occasions d’améliorer la société.',
        notes='Q9 reason 7: Looking for opportunities to make society better.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I support open government as a tool to make democracy stronger',
        semantic_name="q9r_democracy_stronger",
        role="code",
        language=None,
        raw_name_fr='Q9R. J’appuie le gouvernement ouvert en tant qu’outil de renforcement de la démocratie.',
        notes='Q9 reason 8: Support open gov as tool to make democracy stronger.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I provide feedback to the government only when I am asked about an issue I care about',
        semantic_name="q9r_feedback_when_asked",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je fournis des commentaires au gouvernement uniquement lorsqu’on m’interroge sur une question qui me tient à cœur.',
        notes='Q9 reason 9: Feedback only when asked about cared-about issue.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I am looking for opportunities to hold government accountable',
        semantic_name="q9r_hold_gov_accountable",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je cherche des occasions pour tenir le gouvernement responsable.',
        notes='Q9 reason 10: Opportunities to hold government accountable.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I build collections of data and information around a particular topic',
        semantic_name="q9r_build_data_collections",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je compile les données et les renseignements autour d’une question particulière.',
        notes='Q9 reason 11: Build collections of data around particular topic.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I am not that interested in open government actually',
        semantic_name="q9r_not_interested",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je ne m’intéresse pas vraiment au gouvernement ouvert.',
        notes='Q9 reason 12: Not that interested in open government.',
    ),
    ColumnDefinition(
        raw_name='Q9R. I prefer not to answer this question',
        semantic_name="q9r_prefer_not_to_answer",
        role="code",
        language=None,
        raw_name_fr='Q9R. Je préfère ne pas répondre à cette question.',
        notes='Q9 reason 13: Prefer not to answer. 100% empty (0 responses).',
    ),
    ColumnDefinition(
        raw_name='Q9R. Other (please specify)9',
        semantic_name="text_q9r_other_interest",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q9R. Autre, veuillez préciser',
        notes='Q9 free-text other: Citizens specifying unique interests/motivations (424 comments).',
    ),
    ColumnDefinition(
        raw_name='Q10. Would you like to be more involved in developing Canada’s 4th Plan on Open Government',
        semantic_name="q10_more_involvement",
        role="numeric",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q10. Souhaitez-vous participer davantage à l’élaboration du 4e Plan du Canada pour un gouvernement ouvert?',
        notes='Q10: Would like more involvement in 4th Plan? 1=Yes (5406), 2=No (2805), 1 null.',
    ),
    ColumnDefinition(
        raw_name='Q11. What would you like to be involved in?\xa0Check all that apply.',
        semantic_name="q11_involvement_types_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q11.  À quoi souhaitez-vous participer? Cochez tout ce qui s’applique',
        notes='Question prompt header for Q11. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q11R. I would like to share my knowledge',
        semantic_name="q11r_share_knowledge",
        role="code",
        language=None,
        raw_name_fr='Q11R. J’aimerais partager mes connaissances.',
        notes='Q11 involvement 1: Share knowledge.',
    ),
    ColumnDefinition(
        raw_name='Q11R.  I would like to give you feedback on draft documents',
        semantic_name="q11r_feedback_drafts",
        role="code",
        language=None,
        raw_name_fr='Q11R.  J’aimerais vous offrir des commentaires sur les ébauches de documents.',
        notes='Q11 involvement 2: Feedback on draft documents.',
    ),
    ColumnDefinition(
        raw_name='Q11R. I would like to help you organize or run an engagement workshop on open government',
        semantic_name="q11r_organize_workshop",
        role="code",
        language=None,
        raw_name_fr='Q11R.  J’aimerais vous aider à organiser ou exécuter un atelier sur la mobilisation pour le gouvernement ouvert.',
        notes='Q11 involvement 3: Help organize/run workshop.',
    ),
    ColumnDefinition(
        raw_name='Q11R. I would like to promote events for developing Canada’s 4th Plan on Open Government within my network',
        semantic_name="q11r_promote_events",
        role="code",
        language=None,
        raw_name_fr='Q11R. J’aimerais promouvoir des événements pour le développement du 4e Plan du Canada pour un gouvernement ouvert au sein de mon réseau.',
        notes='Q11 involvement 4: Promote events within network.',
    ),
    ColumnDefinition(
        raw_name='Q11R. I would like to attend a workshop',
        semantic_name="q11r_attend_workshop",
        role="code",
        language=None,
        raw_name_fr='Q11R.  J’aimerais participer à un atelier.',
        notes='Q11 involvement 5: Attend a workshop.',
    ),
    ColumnDefinition(
        raw_name='Q11R. Other:\xa0I can..',
        semantic_name="text_q11r_other_involvement_activity",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q11R. Autre : Je peux…',
        notes='Q11 free-text other: Citizens specifying other ways to contribute (224 comments).',
    ),
    ColumnDefinition(
        raw_name='Q12. How would you like to be involved?\xa0Check all that apply.',
        semantic_name="q12_involvement_channels_prompt",
        role="empty_prompt",
        language=None,
        raw_name_fr='Q12. Comment souhaitez-vous participer?\xa0Cochez tout ce qui s’applique.',
        notes='Question prompt header for Q12. 100% empty.',
    ),
    ColumnDefinition(
        raw_name='Q12R. open.canada.ca',
        semantic_name="q12r_open_canada_ca",
        role="code",
        language=None,
        raw_name_fr='Q12R. ouvert.Canada.ca',
        notes='Q12 channel 1: open.canada.ca portal.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Facebook',
        semantic_name="q12r_facebook",
        role="code",
        language=None,
        raw_name_fr='Q12R. Facebook',
        notes='Q12 channel 2: Facebook.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Twitter',
        semantic_name="q12r_twitter",
        role="code",
        language=None,
        raw_name_fr='Q12R. Twitter',
        notes='Q12 channel 3: Twitter.',
    ),
    ColumnDefinition(
        raw_name='Q12R. LinkedIn',
        semantic_name="q12r_linkedin",
        role="code",
        language=None,
        raw_name_fr='Q12R. LinkedIn',
        notes='Q12 channel 4: LinkedIn.',
    ),
    ColumnDefinition(
        raw_name='Q12R.  Reddit',
        semantic_name="q12r_reddit",
        role="code",
        language=None,
        raw_name_fr='Q12R. Reddit',
        notes='Q12 channel 5: Reddit.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Webinars',
        semantic_name="q12r_webinars",
        role="code",
        language=None,
        raw_name_fr='Q12R. Webinaires',
        notes='Q12 channel 6: Webinars.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Github',
        semantic_name="q12r_github",
        role="code",
        language=None,
        raw_name_fr='Q12R.  Github',
        notes='Q12 channel 7: Github.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Google Docs',
        semantic_name="q12r_google_docs",
        role="code",
        language=None,
        raw_name_fr='Q12R. Google Docs',
        notes='Q12 channel 8: Google Docs.',
    ),
    ColumnDefinition(
        raw_name='Q12R. GCcollab',
        semantic_name="q12r_gccollab",
        role="code",
        language=None,
        raw_name_fr='Q12R. GCcollab',
        notes='Q12 channel 9: GCcollab.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Questionnaires like this one',
        semantic_name="q12r_questionnaires",
        role="code",
        language=None,
        raw_name_fr='Q12R. Des questionnaires semblables à celui-ci',
        notes='Q12 channel 10: Questionnaires like this one.',
    ),
    ColumnDefinition(
        raw_name='Q12R.  In person: Small groups',
        semantic_name="q12r_in_person_small",
        role="code",
        language=None,
        raw_name_fr='Q12R. En personne : En petits groupes',
        notes='Q12 channel 11: In person small groups.',
    ),
    ColumnDefinition(
        raw_name='Q12R. In person: Larger groups',
        semantic_name="q12r_in_person_large",
        role="code",
        language=None,
        raw_name_fr='Q12R.  En personne : En grands groupes',
        notes='Q12 channel 12: In person larger groups.',
    ),
    ColumnDefinition(
        raw_name='Q12R. Other (please specify)',
        semantic_name="text_q12r_other_involvement_channel",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q12R. Autre, veuillez préciser',
        notes='Q12 free-text other: Citizens specifying other engagement channels (250 comments).',
    ),
    ColumnDefinition(
        raw_name='Q13. Please indicate your satisfaction with the current open government data and information services on Open.Canada.ca',
        semantic_name="satisfaction_score",
        role="numeric",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q13. Veuillez indiquer votre degré de satisfaction des services de données et de renseignements actuels du gouvernement ouvert à partir du site ouvert.Canada.ca',
        notes='Q13: Satisfaction score with Open.Canada.ca services (1=Very satisfied to 5=Very dissatisfied, 6=Not applicable/Never used). 1 null.',
    ),
    ColumnDefinition(
        raw_name='Q14. Please tell us why:',
        semantic_name="text_q14_satisfaction_reason",
        role="text",
        language="both",
        primary_text_candidate=True,
        retained_in_curated=True,
        raw_name_fr='Q14. Veuillez nous expliquer pourquoi :',
        notes='Q14 free-text: Reason for satisfaction/dissatisfaction score. Primary NLP target (2346 comments).',
    ),
    ColumnDefinition(
        raw_name='Q15. The country I live in is:',
        semantic_name="country",
        role="metadata",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q15. Le pays où j’habite :',
        notes='Q15: Country of residence (8107 non-null). Canada (7837) + International.',
    ),
    ColumnDefinition(
        raw_name='Q16. Province',
        semantic_name="province",
        role="metadata",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q16. Province',
        notes='Q16: Canadian province or territory (8181 non-null).',
    ),
    ColumnDefinition(
        raw_name='Q17. The city or town that I live closest to is:',
        semantic_name="city",
        role="metadata",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q17. La ville où je demeure le plus près :',
        notes='Q17: Closest city or town (7625 non-null). Privacy-sanitized in curated dataset.',
    ),
    ColumnDefinition(
        raw_name='Q18. If you have knowledge or experience with a open government topic that you would be willing to share please tell us about it:',
        semantic_name="text_q18_experience_topic",
        role="text",
        language="both",
        primary_text_candidate=True,
        retained_in_curated=True,
        raw_name_fr='Q18. Si vous avez des connaissances ou une expérience avec un sujet relié au gouvernement ouvert, que vous seriez prêt à partager, veuillez nous le dire.',
        notes='Q18 free-text: Open government topics/experience willing to share. Primary NLP target (849 comments).',
    ),
    ColumnDefinition(
        raw_name='Q19. The sector or group that I identify most closely with is:',
        semantic_name="stakeholder_sector",
        role="metadata",
        language="both",
        required=True,
        retained_in_curated=True,
        raw_name_fr='Q19. Le secteur ou le groupe auquel je m’identifie le plus :',
        notes='Q19: Stakeholder sector/group (8212 non-null). 13 distinct bilingual categories.',
    ),
    ColumnDefinition(
        raw_name='Q19R. Other (please specify)19',
        semantic_name="text_q19r_other_sector",
        role="text",
        language="both",
        retained_in_curated=True,
        raw_name_fr='Q19R. Autre, veuillez préciser',
        notes='Q19 free-text other: Description for self-identified other sector (388 comments).',
    ),
    ColumnDefinition(
        raw_name='Q20. I am answering this questionnaire on behalf of an organization:',
        semantic_name="on_behalf_of_org",
        role="metadata",
        language=None,
        retained_in_curated=True,
        raw_name_fr='Q20. Je réponds à ce questionnaire au nom d’une organisation\xa0:',
        notes='Q20: Answering on behalf of organization? 1=Yes (175), 2=No (7666), 3=Other (260), 111 null.',
    ),
    ColumnDefinition(
        raw_name='Q21. Can we keep in touch and send you news and event details?We take communication and privacy very seriously. By signing up you are agreeing that we can send you messages about open government news and events. You can unsubscribe at any time. Your email',
        semantic_name="administrative_newsletter_consent",
        role="administrative",
        language=None,
        raw_name_fr='Q21. Peut-on rester en contact et vous envoyer des informations et des détails sur des événements? Nous prenons très au sérieux la communication et la protection des renseignements personnels. En vous inscrivant, vous indiquez votre consentement à recevoir nos messages concernant les nouvelles et événements du gouvernement ouvert. Vous pouvez vous désinscrire à tout moment. Votre adresse de courriel ne sera pas publiée avec les résultats de l’enquête et ne sera pas communiquée à d’autres institutions du gouvernement ou à des tiers.',
        notes='Q21: Email updates consent. Administrative newsletter opt-in flag. No emails included.',
    ),
]

OG2017_18_QUESTIONNAIRE_MAP = ColumnMap(
    dataset_id="og2017-18_questionnaire",
    version="1.0.0",
    encoding="Windows-1252",
    header_row=1,
    definitions=OG2017_18_QUESTIONNAIRE_COLUMNS,
)


# ---------------------------------------------------------------------------
# Registry — add new datasets here
# ---------------------------------------------------------------------------

_REGISTRY: Dict[str, ColumnMap] = {
    "ap2016-18": AP2016_18_MAP,
    "og2017-18_questionnaire": OG2017_18_QUESTIONNAIRE_MAP,
    "og_questionnaire_2017_18": OG2017_18_QUESTIONNAIRE_MAP,
    "og_consultation_2017_18": OG2017_18_QUESTIONNAIRE_MAP,
}


def get_column_map(dataset_id: str) -> ColumnMap:
    """
    Returns the ColumnMap for the given dataset ID.

    Args:
        dataset_id: One of the registered dataset IDs (e.g. 'ap2016-18').

    Raises:
        KeyError: If the dataset_id is not registered.
    """
    if dataset_id not in _REGISTRY:
        available = list(_REGISTRY.keys())
        raise KeyError(
            f"Unknown dataset_id '{dataset_id}'. "
            f"Available datasets: {available}"
        )
    return _REGISTRY[dataset_id]


def list_datasets() -> List[str]:
    """Returns all registered dataset IDs."""
    return list(_REGISTRY.keys())
