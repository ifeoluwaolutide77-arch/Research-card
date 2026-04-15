import { XMLParser } from "fast-xml-parser";
import type { PaperSource } from "@/lib/types/models";
import { biomedicalWeight } from "@/services/ingestion/biomedical";

export type IngestedPaper = {
  source: PaperSource;
  external_id: string;
  title: string;
  abstract: string | null;
  published_at: Date | null;
  doi: string | null;
  url: string;
  journal: string | null;
  keywords: string[];
  authors: string[];
  biomedical_score: number;
  raw: unknown;
};

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

async function fetchText(url: string, retries = 3): Promise<string> {
  let last: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("arXiv fetch failed");
}

function pickArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function ingestArxivRecent(maxResults = 25): Promise<IngestedPaper[]> {
  const q = encodeURIComponent("cat:q-bio* OR cat:physics.med-ph");
  const url = `https://export.arxiv.org/api/query?search_query=${q}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${maxResults}`;
  const xml = await fetchText(url);
  const doc = parser.parse(xml) as {
    feed?: { entry?: unknown | unknown[] };
  };
  const entries = pickArray(doc.feed?.entry);
  const out: IngestedPaper[] = [];

  for (const raw of entries) {
    const e = raw as {
      id?: string;
      title?: string;
      summary?: string;
      published?: string;
      author?: { name?: string } | Array<{ name?: string }>;
      "arxiv:doi"?: { ["#text"]?: string } | string;
    };
    const idUrl = String(e.id ?? "");
    const m = idUrl.match(/arxiv\.org\/abs\/([^/?#]+)/i);
    const arxivId = m?.[1] ?? "";
    if (!arxivId) continue;

    const title = String(e.title ?? "").replace(/\s+/g, " ").trim();
    const abstract = String(e.summary ?? "").replace(/\s+/g, " ").trim() || null;
    const published = e.published ? new Date(e.published) : null;
    const doiNode = e["arxiv:doi"];
    const doi =
      typeof doiNode === "string"
        ? doiNode
        : typeof doiNode === "object" && doiNode
          ? String(doiNode["#text"] ?? "")
          : null;

    const authors = pickArray(e.author)
      .map((a) => String((a as { name?: string }).name ?? "").trim())
      .filter(Boolean);

    const textBlob = `${title}\n${abstract ?? ""}`;
    const biomedical_score = Math.min(1, biomedicalWeight(textBlob) + 0.08);

    out.push({
      source: "arxiv",
      external_id: arxivId,
      title,
      abstract,
      published_at: published,
      doi: doi || null,
      url: `https://arxiv.org/abs/${arxivId}`,
      journal: "arXiv",
      keywords: [],
      authors,
      biomedical_score,
      raw: e,
    });
  }
  return out;
}
