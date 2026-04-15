import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const TagsSchema = z.object({
  tags: z.array(z.string()).max(16),
});

export async function inferAuthorInterestTags(params: {
  authorName: string;
  paperSnippets: string[];
}): Promise<string[]> {
  const env = getServerEnv();
  const blob = params.paperSnippets.join("\n---\n").slice(0, 12000);
  if (!env.OPENAI_API_KEY) {
    const freq = new Map<string, number>();
    const tokens = blob
      .toLowerCase()
      .split(/[^a-z0-9+]+/g)
      .filter((w) => w.length >= 6 && w.length <= 32);
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const system = `Given an author's name and short snippets from their recent papers (titles/abstracts only), propose up to 10 concise research interest tags (2-4 words each). Only general themes supported by the snippets. JSON only.`;

  const jsonSchema = {
    name: "author_tags",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["tags"],
      properties: {
        tags: { type: "array", items: { type: "string" }, maxItems: 16 },
      },
    },
    strict: true,
  } as const;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({ authorName: params.authorName, snippets: params.paperSnippets }),
        },
      ],
      response_format: { type: "json_schema", json_schema: jsonSchema },
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return [];
    const parsed = TagsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.tags : [];
  } catch {
    return [];
  }
}
