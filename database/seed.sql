-- Optional seed for local demos (run after schema.sql)
-- Uses fixed UUIDs for stable URLs in documentation screenshots.

INSERT INTO papers (
  id, source, external_id, dedupe_hash, title, abstract, published_at, doi, url, journal, keywords, biomedical_score, raw_json
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'pubmed',
  'seed-1',
  'pubmed:seed-1',
  'Example: placebo-controlled trial of a novel kinase inhibitor in solid tumors',
  'Background: prior preclinical work suggested pathway X drives proliferation. Methods: multicenter phase 2 trial (n=120) randomized 2:1 to drug vs placebo. Primary endpoint: progression-free survival (PFS). Results: median PFS 6.2 months vs 3.1 months (HR 0.54, 95% CI 0.38-0.77, p=0.002). Adverse events were manageable. Limitations: single biomarker enrichment; short follow-up.',
  NOW() - INTERVAL '1 day',
  '10.1234/example.trial.2026',
  'https://pubmed.ncbi.nlm.nih.gov/',
  'Demo Journal',
  ARRAY['oncology','clinical trial'],
  0.92,
  '{}'::jsonb
) ON CONFLICT (dedupe_hash) DO NOTHING;

INSERT INTO authors (id, name, normalized_name, research_tags) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Ada Researcher', 'ada researcher', ARRAY['clinical trials','oncology'])
ON CONFLICT (normalized_name) DO NOTHING;

INSERT INTO paper_authors (paper_id, author_id, position) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 0)
ON CONFLICT (paper_id, author_id) DO NOTHING;

INSERT INTO paper_summaries (
  paper_id, one_liner, problem, objective, methods, results, limitations, improvements, tags, model, ai_disclaimer, source_label, confidence, confidence_numeric, uncertain, uncertainty_notes
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Phase 2 trial reports improved PFS with a kinase inhibitor versus placebo in solid tumors.',
  'Solid tumors may rely on pathway-driven proliferation that existing therapies inadequately address.',
  'Estimate treatment effect on progression-free survival versus placebo.',
  'Multicenter randomized phase 2 design with 2:1 allocation and a defined primary endpoint.',
  'Authors report median PFS 6.2 months vs 3.1 months with HR 0.54 and p=0.002 as stated in the abstract.',
  'Abstract-only view: safety signals, subgroup effects, and confirmatory outcomes are not fully described here.',
  'Longer follow-up, biomarker-defined cohorts, and phase 3 confirmation would strengthen inference.',
  ARRAY['oncology','phase 2','PFS','kinase inhibitor'],
  'seed',
  'AI-generated interpretation of the abstract only. Verify against the full paper.',
  'Based on abstract only',
  'high',
  88,
  FALSE,
  ''
) ON CONFLICT (paper_id) DO NOTHING;
