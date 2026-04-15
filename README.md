
# ResearchCard

Next.js 14 (App Router) + TypeScript + Tailwind + PostgreSQL (`pg`, Supabase-compatible) research intelligence UI with ingestion, ranking, AI summaries, anonymous feedback, and optional weekly digest email.

## Quick start

See **Section 12** in [`RESEARCHCARD_GUIDE.md`](./RESEARCHCARD_GUIDE.md) for full setup. Minimal path:

```bash
npm install
cp .env.example .env.local
# apply database/schema.sql to your database, set DATABASE_URL
npm run ingest
npm run summarize   # optional: set OPENAI_API_KEY
npm run dev
```

## Documentation

- [`RESEARCHCARD_GUIDE.md`](./RESEARCHCARD_GUIDE.md) — product + system design (Sections 1–13)

## Scripts

- `npm run ingest` — PubMed + arXiv + bioRxiv ingestion with dedupe
- `npm run summarize` — batch abstract summaries
- `npm run self-check` — lightweight assertions for confidence/ranking math
