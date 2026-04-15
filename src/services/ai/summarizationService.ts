import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { AiStructuredSummary } from "@/lib/types/models";
import { computeSummaryConfidence } from "@/services/ai/confidence";

const SummarySchema = z.object({
  one_liner: z.string(),
  problem: z.string(),
  objective: z.string(),
  methods: z.string(),
  results: z.string(),
  limitations: z.string(),
  improvements: z.string(),
  tags: z.array(z.string()).max(12),
  uncertain: z.boolean(),
  uncertainty_notes: z.string(),
});

const DISCLAIMER =
  "AI-generated interpretation of the abstract only. Not a substitute for reading the full paper. Findings may be incomplete or mis-stated; verify against the original source.";

export async function summarizeAbstract(params: {
  title: string;
  abstract: string | null;
  journal?: string | null;
}): Promise<{
  summary: AiStructuredSummary;
  model: string | null;
  disclaimer: string;
  sourceLabel: string;
  confidence: ReturnType<typeof computeSummaryConfidence>;
}> {
  const abstract = (params.abstract ?? "").trim();
  const confidence = computeSummaryConfidence(abstract);
  const env = getServerEnv();

  if (!abstract) {
    return {
      summary: {
        one_liner: "Insufficient abstract text available for a reliable summary.",
        problem: "Unknown — abstract missing.",
        objective: "Unknown — abstract missing.",
        methods: "Unknown — abstract missing.",
        results: "Unknown — abstract missing.",
        limitations: "Unknown — abstract missing.",
        improvements: "Unknown — abstract missing.",
        tags: [],
        uncertain: true,
        uncertainty_notes: "No abstract text was available.",
      },
      model: null,
      disclaimer: DISCLAIMER,
      sourceLabel: "Based on abstract only",
      confidence,
    };
  }

  if (!env.OPENAI_API_KEY) {
    const first = abstract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    return {
      summary: {
        one_liner: first.slice(0, 220) + (first.length < abstract.length ? "…" : ""),
        problem: "Not inferred — configure OPENAI_API_KEY for structured extraction.",
        objective: "Not inferred — configure OPENAI_API_KEY for structured extraction.",
        methods: "Not inferred — configure OPENAI_API_KEY for structured extraction.",
        results: "Not inferred — configure OPENAI_API_KEY for structured extraction.",
        limitations: "Automated summaries are disabled without an API key.",
        improvements: "Enable AI summarization to populate this section.",
        tags: [],
        uncertain: true,
        uncertainty_notes: "Heuristic fallback only; no LLM call was made.",
      },
      model: null,
      disclaimer: DISCLAIMER,
      sourceLabel: "Based on abstract only",
      confidence,
    };
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const system = `You are a biomedical research assistant. You MUST only use information explicitly present in the provided title and abstract.
Rules:
- Never invent statistics, outcomes, sample sizes, or claims not stated in the abstract.
- If the abstract is vague, set uncertain=true and explain briefly in uncertainty_notes.
- Use neutral, cautious language. Prefer "the authors report" over definitive claims.
- Output MUST be JSON matching the provided schema. No markdown.`;

  const user = JSON.stringify({
    title: params.title,
    journal: params.journal ?? null,
    abstract,
  });

  const jsonSchema = {
    name: "paper_summary",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "one_liner",
        "problem",
        "objective",
        "methods",
        "results",
        "limitations",
        "improvements",
        "tags",
        "uncertain",
        "uncertainty_notes",
      ],
      properties: {
        one_liner: { type: "string", maxLength: 280 },
        problem: { type: "string" },
        objective: { type: "string" },
        methods: { type: "string" },
        results: { type: "string" },
        limitations: { type: "string" },
        improvements: { type: "string" },
        tags: { type: "array", items: { type: "string" }, maxItems: 12 },
        uncertain: { type: "boolean" },
        uncertainty_notes: { type: "string" },
      },
    },
    strict: true,
  } as const;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: jsonSchema },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty completion");
    const parsed = SummarySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("Schema validation failed");
    return {
      summary: parsed.data,
      model: completion.model,
      disclaimer: DISCLAIMER,
      sourceLabel: "Based on abstract only",
      confidence,
    };
  } catch {
    return {
      summary: {
        one_liner: "Summary generation failed; please rely on the abstract and original paper.",
        problem: "Unavailable due to processing error.",
        objective: "Unavailable due to processing error.",
        methods: "Unavailable due to processing error.",
        results: "Unavailable due to processing error.",
        limitations: "Automated summarization failed; treat all fields as unknown.",
        improvements: "Retry summarization after verifying connectivity and API configuration.",
        tags: [],
        uncertain: true,
        uncertainty_notes: "The model response could not be validated.",
      },
      model: "gpt-4o-mini",
      disclaimer: DISCLAIMER,
      sourceLabel: "Based on abstract only",
      confidence,
    };
  }
}
