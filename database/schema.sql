-- ResearchCard: PostgreSQL schema (Supabase-compatible)
-- Run in Supabase SQL editor or: psql $DATABASE_URL -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE paper_source AS ENUM ('pubmed', 'arxiv', 'biorxiv');
CREATE TYPE summary_confidence AS ENUM ('high', 'medium', 'low');

CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source paper_source NOT NULL,
  external_id TEXT NOT NULL,
  dedupe_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  published_at TIMESTAMPTZ,
  doi TEXT,
  url TEXT NOT NULL,
  journal TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  biomedical_score REAL NOT NULL DEFAULT 0,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT papers_dedupe_hash_unique UNIQUE (dedupe_hash)
);

CREATE INDEX papers_published_at_desc ON papers (published_at DESC NULLS LAST);
CREATE INDEX papers_source_published ON papers (source, published_at DESC NULLS LAST);
CREATE INDEX papers_biomedical ON papers (biomedical_score DESC);

CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  orcid TEXT,
  research_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT authors_normalized_name_unique UNIQUE (normalized_name)
);

CREATE TABLE paper_authors (
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (paper_id, author_id)
);

CREATE INDEX paper_authors_author ON paper_authors (author_id);

CREATE TABLE paper_summaries (
  paper_id UUID PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  one_liner TEXT,
  problem TEXT,
  objective TEXT,
  methods TEXT,
  results TEXT,
  limitations TEXT,
  improvements TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  model TEXT,
  ai_disclaimer TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT 'Based on abstract only',
  confidence summary_confidence NOT NULL DEFAULT 'medium',
  confidence_numeric REAL,
  uncertain BOOLEAN NOT NULL DEFAULT FALSE,
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX feedback_paper_created ON feedback (paper_id, created_at DESC);
CREATE INDEX feedback_fp_created ON feedback (fingerprint, created_at DESC);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
  confirm_token TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_email_unique UNIQUE (email)
);

CREATE INDEX subscriptions_weekly ON subscriptions (weekly_digest) WHERE weekly_digest = TRUE AND confirmed = TRUE;
