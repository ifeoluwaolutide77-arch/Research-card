# ResearchCard — System Design, Data Pipeline, AI Safety, and Product Guide

This document satisfies the ResearchCard product brief: strategy, architecture, data models, AI controls, ranking, tests, deployment, and roadmap. The runnable application lives in this repository (`research-card/`).

---

## SECTION 1: Product strategy summary

ResearchCard is a **trust-first research scanner**: it aggregates **openly accessible metadata** (PubMed, arXiv, bioRxiv), **deduplicates** records, and renders each item as a **standardized Research Card** with **AI-labeled, abstract-only** structured fields. The product optimizes for **speed (under ~60 seconds to triage a batch)**, **transparency**, and **explicit uncertainty** rather than authoritative claims.

**Positioning:** default ranking **overweights biomedical / pharma-relevant language** (`biomedical_score` + keyword signals) while still showing other domains when present.

**Retention:** lightweight **email capture** plus a **weekly digest trigger** (`POST /api/cron/weekly-digest`) without building full accounts.

**Moat (near-term):** disciplined ingestion + dedupe + ranking transparency + user feedback loop, not “more AI text.”

---

## SECTION 2: System architecture overview

| Layer | Responsibility | Location |
| --- | --- | --- |
| UI | Pages, cards, filters, author view | `src/app/*`, `src/components/*` |
| API | HTTP surface for papers, feedback, subscribe, digest cron | `src/app/api/*` |
| Data access | SQL via `pg` repositories | `src/lib/db/*` |
| Ingestion | PubMed / arXiv / bioRxiv fetch + parse + dedupe | `src/services/ingestion/*` |
| AI summarization | Structured JSON summaries + fallbacks | `src/services/ai/*` |
| Ranking | Signal extraction + composite score + discovery lists | `src/services/ranking/*` |
| Feedback | Throttled anonymous votes | `src/services/feedback/*` |
| Email | Resend-backed weekly HTML (optional) | `src/services/email/*` |
| Batch jobs | CLI ingestion + summarization | `scripts/*` |

**Runtime model:** Next.js **Route Handlers** call repositories directly (no separate Node service). **Postgres** is the system of record (Supabase-compatible).

---

## SECTION 3: Full feature blueprint

- **Discovery hook (homepage):** “Top 10 Papers Today,” “Trending,” “Breakthrough of the Day” via `buildDiscoveryLists`.
- **Trust layer:** confidence label + “Based on abstract only” + AI disclaimer on every card (`TrustBadge`, `paper_summaries` fields).
- **Feedback:** 👍/👎 stored with hashed browser fingerprint + throttling (`/api/feedback`).
- **Retention:** `/api/subscribe` + weekly digest sender (`/api/cron/weekly-digest`).
- **Researcher discovery:** `/authors/[id]` aggregates papers and maintains `authors.research_tags` (AI or heuristic fallback).
- **Search & filter:** querystring-driven homepage search (`q`, `source`).
- **Paper detail:** `/papers/[id]` shows expanded card + numeric ranking signals.

---

## SECTION 4: Data models and schema (SQL + types)

**Canonical SQL:** `database/schema.sql`  
**TypeScript models:** `src/lib/types/models.ts`

**Core tables:** `papers`, `authors`, `paper_authors`, `paper_summaries`, `feedback`, `subscriptions`.

**Enums:** `paper_source`, `summary_confidence`.

**Dedupe:** `dedupe_hash` unique; ingestion prefers `doi:<normalized>` when DOI exists, else `source:external_id`.

---

## SECTION 5: AI prompt templates + scoring logic

**Prompting strategy:** system message enforces **abstract-only grounding**, **no invented statistics**, **uncertain flag** when abstract is vague, JSON-only structured output (`src/services/ai/summarizationService.ts`).

**Confidence (non-AI heuristic):** `computeSummaryConfidence` uses abstract length, numeric density, and simple clarity heuristics (`src/services/ai/confidence.ts`).

**Failure modes:** missing `OPENAI_API_KEY` → safe heuristic text; API/parse failure → explicit “unavailable” fields with `uncertain=true`.

---

## SECTION 6: Ranking algorithm definitions

Signals (0–100 scale where applicable):

1. **Recency:** inverse age curve (`recencyScore`).
2. **Quantitative findings:** regex hits for `%`, `n=`, `p<`, HR/OR/RR, units (`quantitativeScore`).
3. **Keyword / domain:** biomedical lexicon in title+abstract+keywords (`keywordScore`).
4. **Engagement:** thumbs with dampening for low volume (`engagementScore`).
5. **Biomedical boost:** stored `biomedical_score` on ingest (0–1) scaled to 0–100 in composite.

**Composite:** weighted sum in `compositeRanking` (recency 0.28, quantitative 0.22, keyword 0.22, engagement 0.18, biomedical 0.10).

**Discovery lists:**

- **Top 10 Today:** top composite among papers whose `published_at` (fallback `created_at`) is **today** in server local calendar; if none, falls back to global top composite.
- **Trending:** top composite overall (slice).
- **Breakthrough of the Day:** first paper with quantitative ≥ 55 and keyword ≥ 40, else top composite.

---

## SECTION 7: File and folder structure

```
research-card/
  database/
    schema.sql
    seed.sql
  scripts/
    ingest.ts
    summarize-batch.ts
    self-check.ts
  src/
    app/
      api/cron/weekly-digest/route.ts
      api/feedback/route.ts
      api/papers/route.ts
      api/papers/[id]/route.ts
      api/subscribe/route.ts
      authors/[id]/page.tsx
      papers/[id]/page.tsx
      layout.tsx
      page.tsx
      globals.css
    components/
      DiscoveryRails.tsx
      EmailCapture.tsx
      ExpandedCard.tsx
      ResearchCard.tsx
      SearchFilter.tsx
      TrustBadge.tsx
    lib/
      db/            # pool + repositories + hydration
      env.ts
      types/models.ts
    services/
      ai/
      batch/
      email/
      feedback/
      ingestion/
      ranking/
```

---

## SECTION 8: FULL APPLICATION CODE

**Authoritative source:** the repository on disk (`C:\Users\USER-PC\research-card`) contains the **complete, build-verified** Next.js 14 application (`npm run build` succeeds). This guide intentionally does not duplicate every source line; use your editor/IDE to navigate modules listed in Section 7.

**Key entry points:**

- UI homepage: `src/app/page.tsx`
- Research card: `src/components/ResearchCard.tsx`
- Expanded view: `src/components/ExpandedCard.tsx` + `src/app/papers/[id]/page.tsx`
- Search/filter: `src/components/SearchFilter.tsx`
- Author page: `src/app/authors/[id]/page.tsx`
- APIs: `src/app/api/papers/route.ts`, `src/app/api/papers/[id]/route.ts`, `src/app/api/feedback/route.ts`, `src/app/api/subscribe/route.ts`
- Ingestion: `src/services/ingestion/*` + `scripts/ingest.ts`
- Summarization: `src/services/ai/summarizationService.ts` + `src/services/batch/runSummarization.ts` + `scripts/summarize-batch.ts`
- Ranking: `src/services/ranking/*`
- DB schema: `database/schema.sql`

---

## SECTION 9: Seed data + example outputs

**Seed SQL:** `database/seed.sql` inserts one demo PubMed-style paper with summary + author linkage.

**Example API JSON (shape):** `GET /api/papers` returns:

```json
{
  "papers": [ { "...PaperWithSummary": true } ],
  "discovery": {
    "top10Today": [],
    "trending": [],
    "breakthrough": null
  }
}
```

After ingestion + summarization, arrays populate based on live DB content.

---

## SECTION 10: Test plan + sample test cases

**Automated smoke (logic only):** `npm run self-check` executes numeric assertions for confidence + ranking helpers.

**Manual QA checklist:**

1. **DB missing:** unset `DATABASE_URL` → homepage shows setup instructions (no crash).
2. **Ingestion:** `npm run ingest` → rows appear in `papers` with realistic URLs.
3. **Summaries:** with `OPENAI_API_KEY`, `npm run summarize` → `paper_summaries` populated; without key → heuristic path still writes rows.
4. **Trust copy:** each card shows confidence + “Based on abstract only” + disclaimer.
5. **Feedback:** rapid 👍 clicks → eventually HTTP 429 from throttler.
6. **Subscribe:** valid email returns 200; duplicate email upserts without error.
7. **Digest cron:** `POST /api/cron/weekly-digest` without `x-cron-secret` → 401; with valid secret → 200 and Resend logs (or skip if no key).

**Edge cases:** empty bioRxiv window (no items) should not fail pipeline; PubMed XML shape drift should fail soft at ingestion batch level (logged).

---

## SECTION 11: IMPLEMENTATION DOCUMENT (CRITICAL)

### Product philosophy

Ship **clarity + provenance** before features. The UI repeatedly reinforces: **AI = interpretation**, **abstract = partial evidence**, **full text = authority**.

### AI safety strategy

- **Grounding:** model instructed to use **only** title+abstract; numeric claims must appear in abstract.
- **Structured output:** JSON schema path for `gpt-4o-mini` where configured.
- **Uncertainty:** model emits `uncertain` + `uncertainty_notes`; UI surfaces them.
- **Fallbacks:** deterministic safe strings when keys missing or model fails.

### Data ingestion strategy

- **PubMed:** NCBI E-utilities (`esearch` + `efetch`, XML).
- **arXiv:** Atom API (`export.arxiv.org`).
- **bioRxiv:** public JSON details endpoint (`api.biorxiv.org`).
- **Dedupe:** DOI-first hash when DOI exists; else source-native id.
- **Retries:** simple exponential backoff in fetch helpers.

### Summary quality control

- **Heuristic confidence** always computed from abstract text (independent of LLM).
- **Disclaimers** always persisted (`ai_disclaimer`, `source_label`).
- **Batch summarization** rate-limited in script (`summarize-batch.ts`).

### Trust and UX guidelines

- Always show **“Original source”** CTA.
- Never label AI text as “findings confirmed.”
- Show **ranking signals** on detail page for transparency.

### Performance optimization

- Homepage DB path batches summaries via join; still N+1 for authors/feedback — acceptable at MVP scale; next step is JSON aggregation / materialized views.
- Add DB indexes already in schema for hot paths.

### Scaling roadmap

- Worker queue (e.g., Supabase Edge Functions / background worker) for ingestion+summaries.
- Materialized ranking table refreshed periodically.
- Vector search (optional) with explicit “similarity ≠ truth” UX.

### Known limitations

- Summaries are **abstract-limited** by design (no full-text mining here).
- **Engagement** starts at zero until traffic arrives (cold-start bias handled by other signals).
- **Author disambiguation** is naive (name-only keys) — production needs ORCID graph + institution data.

### Deployment considerations

- Requires **Node + Postgres** (Supabase connection string).
- Store secrets in hosting provider (Vercel/Render/Fly).
- Schedule digest via platform cron hitting `/api/cron/weekly-digest` with `CRON_SECRET` header.

### Maintenance strategy

- Monitor upstream API quotas (NCBI, arXiv polite usage).
- Log ingestion failures and dead-letter rows (future table).
- Periodically re-run summarization when prompts change (version field future).

---

## SECTION 12: Setup and deployment instructions

1. **Install:** `cd research-card && npm install`
2. **Configure:** copy `.env.example` → `.env.local` and set `DATABASE_URL` (Supabase “Connection string” URI mode).
3. **Schema:** run `database/schema.sql` in Supabase SQL editor (or `psql`).
4. **Seed (optional):** run `database/seed.sql`.
5. **Populate:** `npm run ingest` then `npm run summarize` (set `OPENAI_API_KEY` for full LLM summaries).
6. **Dev server:** `npm run dev` → http://localhost:3000
7. **Prod build:** `npm run build && npm start`
8. **Email (optional):** set `RESEND_API_KEY` + `DIGEST_FROM_EMAIL`.

---

## SECTION 13: Future roadmap

- Full-text aware cards **only** when licensing + storage + provenance pipeline exist.
- ORCID-backed author graph + disambiguation.
- Personalized feeds (still without mandatory login; tokenized URLs).
- Active learning from 👍/👎 to re-rank (with safeguards against brigading).
- Multi-language abstracts with explicit translation provenance.
