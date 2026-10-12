# Data Quality Report: `og2017-18_questionnaire` v1.0.0

**Generated:** 2026-10-12T08:42:19.972584+00:00
**Rows:** 8212  |  **Columns:** 98
**Full duplicate rows:** 0
**Rows with no text content:** 4470
**DataFrame hash (SHA-256):** `bebcc9e5264fc00788c4094b579f90dcf2f8590aaeab528f30a338a7e2344239`

## ⚠️ Global Warnings
- 4470 rows have no content in any text column.

## Column-Level Quality
| Column | DType | Null % | Unique | Min Len | Max Len | Avg Len | Warnings |
|--------|-------|--------|--------|---------|---------|---------|----------|
| `respondent_id` | int64 | 0.0% | 8212 | — | — | — | OK |
| `language` | object | 0.0% | 2 | 17 | 18 | 17.8 | OK |
| `start_date` | object | 0.0% | 8202 | 18 | 19 | 18.8 | OK |
| `end_date` | object | 0.0% | 8200 | 18 | 19 | 18.8 | OK |
| `q1_transparency_important` | float64 | 0.0% | 2 | — | — | — | OK |
| `q2_transparency_topics_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q2r_find_person` | float64 | 58.6% | 1 | — | — | — | HIGH missingness: 58.6% |
| `q2r_policies_programs` | float64 | 60.5% | 1 | — | — | — | HIGH missingness: 60.4% |
| `q2r_request_documents` | float64 | 54.8% | 1 | — | — | — | HIGH missingness: 54.7% |
| `q2r_work_of_officials` | float64 | 85.1% | 1 | — | — | — | HIGH missingness: 85.1% |
| `q2r_spending` | float64 | 54.2% | 1 | — | — | — | HIGH missingness: 54.2% |
| `q2r_same_data_as_gov` | float64 | 61.9% | 1 | — | — | — | HIGH missingness: 61.9% |
| `q2r_proactive_disclosure` | float64 | 74.2% | 1 | — | — | — | HIGH missingness: 74.2% |
| `q2r_working_with_other_govs` | float64 | 77.7% | 1 | — | — | — | HIGH missingness: 77.7% |
| `text_q2r_other_transparency` | object | 93.2% | 557 | 2 | 1558 | 94.0 | HIGH missingness: 93.2% |
| `q3_accountability_important` | float64 | 0.0% | 2 | — | — | — | OK |
| `q4_accountability_needs_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q4r_track_spending_conflicts` | float64 | 41.4% | 1 | — | — | — | MEDIUM missingness: 41.4% |
| `q4r_influence_decision_making` | float64 | 40.9% | 1 | — | — | — | MEDIUM missingness: 40.9% |
| `q4r_holding_gov_accountable` | float64 | 40.8% | 1 | — | — | — | MEDIUM missingness: 40.8% |
| `q4r_track_commitments` | float64 | 46.3% | 1 | — | — | — | MEDIUM missingness: 46.3% |
| `q4r_privacy_data_protection` | float64 | 56.6% | 1 | — | — | — | HIGH missingness: 56.6% |
| `text_q4r_other_accountability` | object | 94.5% | 451 | 1 | 1203 | 91.9 | HIGH missingness: 94.5% |
| `q5_participation_important` | float64 | 0.0% | 2 | — | — | — | OK |
| `q6_participation_ways_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q6r_provide_views_concerns` | float64 | 53.5% | 1 | — | — | — | HIGH missingness: 53.5% |
| `q6r_input_decision_making` | float64 | 50.2% | 1 | — | — | — | HIGH missingness: 50.2% |
| `q6r_interact_other_canadians` | float64 | 79.9% | 1 | — | — | — | HIGH missingness: 79.9% |
| `q6r_collaborate_directly` | float64 | 63.2% | 1 | — | — | — | HIGH missingness: 63.2% |
| `q6r_share_info_across_depts` | float64 | 73.6% | 1 | — | — | — | HIGH missingness: 73.6% |
| `q6r_suggest_service_improvements` | float64 | 53.8% | 1 | — | — | — | HIGH missingness: 53.8% |
| `q6r_track_request_status` | float64 | 69.2% | 1 | — | — | — | HIGH missingness: 69.2% |
| `text_q6r_other_participation` | object | 96.6% | 274 | 1 | 1650 | 106.8 | HIGH missingness: 96.6% |
| `q7_strategic_outcomes_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q7r_income_security_employment` | float64 | 68.3% | 1 | — | — | — | HIGH missingness: 68.3% |
| `q7r_economic_growth` | float64 | 78.2% | 1 | — | — | — | HIGH missingness: 78.2% |
| `q7r_innovation_knowledge_economy` | float64 | 82.4% | 1 | — | — | — | HIGH missingness: 82.4% |
| `q7r_clean_healthy_environment` | float64 | 67.9% | 1 | — | — | — | HIGH missingness: 67.9% |
| `q7r_fair_secure_workplace` | float64 | 87.4% | 1 | — | — | — | HIGH missingness: 87.4% |
| `q7r_healthy_canadians` | float64 | 72.2% | 1 | — | — | — | HIGH missingness: 72.2% |
| `q7r_safe_secure_canada` | float64 | 72.4% | 1 | — | — | — | HIGH missingness: 72.4% |
| `q7r_diverse_inclusive_society` | float64 | 90.6% | 1 | — | — | — | HIGH missingness: 90.6% |
| `q7r_culture_heritage` | float64 | 94.4% | 1 | — | — | — | HIGH missingness: 94.4% |
| `q7r_safe_secure_world` | float64 | 91.2% | 1 | — | — | — | HIGH missingness: 91.2% |
| `q7r_global_poverty_reduction` | float64 | 88.5% | 1 | — | — | — | HIGH missingness: 88.5% |
| `q7r_na_partnership` | float64 | 96.0% | 1 | — | — | — | HIGH missingness: 96.0% |
| `q7r_global_commerce` | float64 | 91.8% | 1 | — | — | — | HIGH missingness: 91.8% |
| `q7r_democratic_institutions` | float64 | 85.2% | 1 | — | — | — | HIGH missingness: 85.2% |
| `q7r_open_accountable_gov` | float64 | 65.1% | 1 | — | — | — | HIGH missingness: 65.1% |
| `q7r_efficient_operations` | float64 | 71.2% | 1 | — | — | — | HIGH missingness: 71.2% |
| `text_q8_missed_topics` | object | 73.3% | 2169 | 1 | 5906 | 223.5 | HIGH missingness: 73.3% |
| `q9_interest_reasons_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q9r_new_curious` | float64 | 73.3% | 1 | — | — | — | HIGH missingness: 73.3% |
| `q9r_learn_more` | float64 | 65.2% | 1 | — | — | — | HIGH missingness: 65.2% |
| `q9r_web_apps_technical` | float64 | 93.7% | 1 | — | — | — | HIGH missingness: 93.7% |
| `q9r_sift_data_insights` | float64 | 74.9% | 1 | — | — | — | HIGH missingness: 74.9% |
| `q9r_start_business` | float64 | 92.3% | 1 | — | — | — | HIGH missingness: 92.3% |
| `q9r_enhance_business` | float64 | 92.2% | 1 | — | — | — | HIGH missingness: 92.2% |
| `q9r_make_society_better` | float64 | 51.3% | 1 | — | — | — | HIGH missingness: 51.3% |
| `q9r_democracy_stronger` | float64 | 44.1% | 1 | — | — | — | MEDIUM missingness: 44.1% |
| `q9r_feedback_when_asked` | float64 | 81.3% | 1 | — | — | — | HIGH missingness: 81.3% |
| `q9r_hold_gov_accountable` | float64 | 69.0% | 1 | — | — | — | HIGH missingness: 69.0% |
| `q9r_build_data_collections` | float64 | 91.7% | 1 | — | — | — | HIGH missingness: 91.7% |
| `q9r_not_interested` | float64 | 96.2% | 1 | — | — | — | HIGH missingness: 96.2% |
| `q9r_prefer_not_to_answer` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `text_q9r_other_interest` | object | 94.8% | 424 | 1 | 769 | 106.8 | HIGH missingness: 94.8% |
| `q10_more_involvement` | float64 | 0.0% | 2 | — | — | — | OK |
| `q11_involvement_types_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q11r_share_knowledge` | float64 | 74.0% | 1 | — | — | — | HIGH missingness: 74.1% |
| `q11r_feedback_drafts` | float64 | 63.7% | 3 | — | — | — | HIGH missingness: 63.7% |
| `q11r_organize_workshop` | float64 | 83.6% | 3 | — | — | — | HIGH missingness: 83.6% |
| `q11r_promote_events` | float64 | 86.5% | 3 | — | — | — | HIGH missingness: 86.5% |
| `q11r_attend_workshop` | float64 | 62.2% | 3 | — | — | — | HIGH missingness: 62.2% |
| `text_q11r_other_involvement_activity` | object | 97.3% | 224 | 1 | 3296 | 84.9 | HIGH missingness: 97.3% |
| `q12_involvement_channels_prompt` | float64 | 100.0% | 0 | — | — | — | HIGH missingness: 100.0% |
| `q12r_open_canada_ca` | float64 | 76.7% | 1 | — | — | — | HIGH missingness: 76.7% |
| `q12r_facebook` | float64 | 80.8% | 1 | — | — | — | HIGH missingness: 80.8% |
| `q12r_twitter` | float64 | 91.8% | 1 | — | — | — | HIGH missingness: 91.8% |
| `q12r_linkedin` | float64 | 87.8% | 1 | — | — | — | HIGH missingness: 87.8% |
| `q12r_reddit` | float64 | 96.3% | 1 | — | — | — | HIGH missingness: 96.3% |
| `q12r_webinars` | float64 | 80.5% | 1 | — | — | — | HIGH missingness: 80.5% |
| `q12r_github` | float64 | 97.6% | 1 | — | — | — | HIGH missingness: 97.6% |
| `q12r_google_docs` | float64 | 84.2% | 1 | — | — | — | HIGH missingness: 84.1% |
| `q12r_gccollab` | float64 | 94.0% | 1 | — | — | — | HIGH missingness: 94.0% |
| `q12r_questionnaires` | float64 | 60.5% | 1 | — | — | — | HIGH missingness: 60.5% |
| `q12r_in_person_small` | float64 | 67.1% | 1 | — | — | — | HIGH missingness: 67.1% |
| `q12r_in_person_large` | float64 | 76.5% | 1 | — | — | — | HIGH missingness: 76.5% |
| `text_q12r_other_involvement_channel` | object | 97.0% | 229 | 1 | 412 | 53.9 | HIGH missingness: 97.0% |
| `satisfaction_score` | float64 | 0.0% | 6 | — | — | — | OK |
| `text_q14_satisfaction_reason` | object | 71.4% | 2309 | 2 | 1131 | 75.4 | HIGH missingness: 71.4% |
| `country` | object | 1.3% | 129 | 3 | 40 | 6.1 | OK |
| `province` | object | 0.4% | 18 | 5 | 22 | 9.2 | OK |
| `city` | object | 7.2% | 1219 | 1 | 59 | 8.1 | OK |
| `text_q18_experience_topic` | object | 89.7% | 808 | 1 | 1760 | 92.8 | HIGH missingness: 89.7% |
| `stakeholder_sector` | object | 0.0% | 13 | 13 | 125 | 34.9 | OK |
| `text_q19r_other_sector` | object | 95.3% | 358 | 1 | 317 | 30.6 | HIGH missingness: 95.3% |
| `on_behalf_of_org` | float64 | 1.4% | 3 | — | — | — | OK |
| `administrative_newsletter_consent` | float64 | 0.0% | 2 | — | — | — | OK |