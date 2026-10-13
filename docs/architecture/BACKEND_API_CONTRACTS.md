# PolicyLens Backend — API Contracts & Architecture Proposal

**Status:** Proposed Architecture & API Specification  
**Branch:** `feat/policylens-backend`  
**Date:** 2026-10-13  
**Base Commit:** `f5bb121` (main)

---

## 1. Architecture Overview & Inspection Summary

### Existing Backend State
- **Domain Layer (`backend/domain/`):** Pure contracts, entities, and value objects decoupled from external frameworks.
- **Application Services (`backend/application/services/`):**
  - `DemandDetector` & `DemandStatus`: Implements safeguard tiers (`EXPLICIT_DEMAND`, `IMPLICIT_DEMAND`, `CONCERN_ONLY`, `UNCLEAR_OR_INSUFFICIENT`) and attribution tiers (`RESPONDENT_EXPLICIT_DEMAND`, `MODEL_INFERRED_RECOMMENDATION`, `ANALYST_PROPOSED_ACTION`).
- **Infrastructure (`backend/infrastructure/`):**
  - `ingestion/`: CSV loader, bilingual column mappings (OG2017-18, AP2016-18), PII sanitization (Canadian postal code redaction), and dataset curation pipelines.
  - `persistence/` & `security/`: Skeletons ready for PostgreSQL repository implementations, password hashing, and token handling.
- **Test Suite:** 117 unit and ML pipeline tests passing (`tests/unit/ingestion/`, `tests/ml_pipeline/`).

---

## 2. Proposed API Contracts (FastAPI v1)

### 2.1 Health & Diagnostics
```http
GET /api/v1/health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-10-13T14:30:00Z",
  "checks": {
    "database": "connected",
    "ml_engine": "ready"
  }
}
```

---

### 2.2 Consultations (Public Feed)
```http
GET /api/v1/consultations?sort=latest&time_range=24h&language=all&category=energy&search=solar&cursor=eyJpZCI6MTB9&limit=20
```

**Query Parameters:**
- `sort`: `latest` (default) | `trending`
- `time_range`: `24h` | `7d` | `30d` | `all` (default)
- `language`: `all` (default) | `en` | `hi` | `mr` | `ta` | `te`
- `category`: optional string filter (e.g., `governance`, `environment`, `healthcare`, `energy`, `transport`, `education`)
- `search`: optional string query
- `cursor`: opaque string for forward cursor pagination
- `limit`: integer (default: 20, max: 50)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "c-101",
      "slug": "rooftop-solar-decentralized-microgrid-incentives",
      "title": "National Rooftop Solar and Decentralized Microgrid Scheme (Draft Guidelines 2026)",
      "summary": "Proposed framework for streamlining net-metering compliance, solar subsidies for MSMEs, and rural battery storage incentives.",
      "category": "Energy & Power",
      "category_slug": "energy",
      "status": "active",
      "status_label": "Consultation Active",
      "deadline": "2026-11-20T18:00:00+05:30",
      "published_at": "2026-10-12T10:00:00+05:30",
      "time_relative": "1d ago",
      "language": "English, Hindi",
      "source_authority": "Ministry of New and Renewable Energy",
      "source_url": "https://example.gov.in/solar-consultation-2026",
      "metrics": {
        "responses_count": 412,
        "demands_count": 89,
        "concerns_count": 142,
        "verified_evidence_count": 47
      }
    }
  ],
  "next_cursor": "eyJpZCI6MTAxfQ==",
  "has_more": false,
  "total_count": 1
}
```

---

### 2.3 Consultation Detail
```http
GET /api/v1/consultations/{slug}
```

**Response (200 OK):**
```json
{
  "id": "c-101",
  "slug": "rooftop-solar-decentralized-microgrid-incentives",
  "title": "National Rooftop Solar and Decentralized Microgrid Scheme (Draft Guidelines 2026)",
  "summary": "Proposed framework for streamlining net-metering compliance, solar subsidies for MSMEs, and rural battery storage incentives.",
  "full_description": "The Ministry invites comments on amending the national solar policy to lower compliance burdens on small industrial clusters, provide direct financial transfers for battery storage installations, and introduce standard multi-state net metering agreements.",
  "category": "Energy & Power",
  "status": "active",
  "deadline": "2026-11-20T18:00:00+05:30",
  "published_at": "2026-10-12T10:00:00+05:30",
  "source_authority": "Ministry of New and Renewable Energy",
  "source_document_url": "https://example.gov.in/solar-consultation-2026.pdf",
  "stats": {
    "total_responses": 412,
    "support_count": 256,
    "oppose_count": 78,
    "neutral_count": 78,
    "demands_count": 89,
    "concerns_count": 142,
    "verified_evidence_count": 47
  }
}
```

---

### 2.4 Citizen Stance & Feedback Submission
```http
POST /api/v1/consultations/{slug}/feedback
```

**Request Body:**
```json
{
  "stance": "support",
  "comment_text": "We strongly support the battery storage subsidy for small workshops, but urge the ministry to mandate a single-window timeline of under 21 days for discom meter approvals.",
  "stakeholder_type": "msme_representative",
  "source_language": "en"
}
```

**Processing Pipeline (Backend Application Services):**
1. **Input Sanitization & Length Check:** Prevents script injection and verifies 10–2000 character boundaries.
2. **Demand Presence Safeguard (`DemandDetector`):**
   - Evaluates linguistic features, modal verbs, and condition clauses.
   - Extracts explicit demand (`"mandate a single-window timeline of under 21 days for discom meter approvals"`).
   - Extracts concern (`"delays in discom meter approvals"`).
   - Attaches attribution tier: `RESPONDENT_EXPLICIT_DEMAND`.
3. **Database Transaction:** Persists reaction and audit record atomically.

**Response (201 Created):**
```json
{
  "submission_id": "sub_8f293b",
  "status": "verified",
  "created_at": "2026-10-13T14:32:00Z",
  "demand_safeguard": {
    "demand_status": "EXPLICIT_DEMAND",
    "attribution_tier": "RESPONDENT_EXPLICIT_DEMAND",
    "safeguard_decision": "EXTRACT_CITIZEN_DEMAND",
    "extracted_demand": "mandate a single-window timeline of under 21 days for discom meter approvals"
  }
}
```

---

## 3. Database Schema Blueprint (PostgreSQL)

### Tables
1. `users`:
   - `id`: UUID (PK)
   - `email`: VARCHAR(255) UNIQUE NOT NULL
   - `hashed_password`: VARCHAR(255) NOT NULL
   - `stakeholder_type`: VARCHAR(50)
   - `verified`: BOOLEAN DEFAULT FALSE
   - `created_at`: TIMESTAMPTZ NOT NULL
2. `consultations`:
   - `id`: VARCHAR(64) (PK)
   - `slug`: VARCHAR(128) UNIQUE NOT NULL
   - `title`: TEXT NOT NULL
   - `summary`: TEXT NOT NULL
   - `full_description`: TEXT
   - `category`: VARCHAR(64) NOT NULL
   - `status`: VARCHAR(32) NOT NULL
   - `source_authority`: VARCHAR(128) NOT NULL
   - `source_url`: TEXT NOT NULL
   - `published_at`: TIMESTAMPTZ NOT NULL
   - `deadline`: TIMESTAMPTZ NOT NULL
3. `submissions`:
   - `id`: UUID (PK)
   - `consultation_id`: VARCHAR(64) REFERENCES `consultations(id)`
   - `user_id`: UUID REFERENCES `users(id)` (NULL for anonymous public input)
   - `stance`: VARCHAR(16) CHECK (`stance IN ('support', 'oppose', 'neutral')`)
   - `comment_text`: TEXT NOT NULL
   - `source_language`: VARCHAR(16) NOT NULL
   - `demand_status`: VARCHAR(32) NOT NULL
   - `attribution_tier`: VARCHAR(32) NOT NULL
   - `extracted_demand`: TEXT
   - `extracted_concern`: TEXT
   - `created_at`: TIMESTAMPTZ NOT NULL
