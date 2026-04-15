import type { Pool } from "pg";
import { getPaperById } from "@/lib/db/papers.repository";
import { upsertSummary } from "@/lib/db/summaries.repository";
import { summarizeAbstract } from "@/services/ai/summarizationService";

export async function summarizePaperById(pool: Pool, paperId: string): Promise<void> {
  const paper = await getPaperById(pool, paperId);
  if (!paper) throw new Error(`Paper not found: ${paperId}`);
  const out = await summarizeAbstract({
    title: paper.title,
    abstract: paper.abstract,
    journal: paper.journal,
  });
  await upsertSummary(pool, {
    paper_id: paperId,
    one_liner: out.summary.one_liner,
    problem: out.summary.problem,
    objective: out.summary.objective,
    methods: out.summary.methods,
    results: out.summary.results,
    limitations: out.summary.limitations,
    improvements: out.summary.improvements,
    tags: out.summary.tags,
    model: out.model,
    ai_disclaimer: out.disclaimer,
    source_label: out.sourceLabel,
    confidence: out.confidence.confidence,
    confidence_numeric: out.confidence.numeric,
    uncertain: out.summary.uncertain,
    uncertainty_notes: out.summary.uncertainty_notes,
  });
}
