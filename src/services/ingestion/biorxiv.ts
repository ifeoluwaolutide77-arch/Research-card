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

async function fetchJson(url: string, retries = 3): Promise<unknown> {
  let last: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("bioRxiv fetch failed");
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function ingestBioRxivRecent(maxResults = 25): Promise<IngestedPaper[]> {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 120);

  const cursor = 0;
  const url = `https://api.biorxiv.org/details/biorxiv/${formatDate(start)}/${formatDate(end)}/${cursor}`;
  const json = (await fetchJson(url)) as {
    collection?: Array<{
      doi?: string;
      title?: string;
      abstract?: string;
      date?: string;
      authors?: string;
      category?: string;
    }>;
  };

  const items = (json.collection ?? []).slice(0, maxResults);
  const out: IngestedPaper[] = [];

  for (const it of items) {
    const doi = String(it.doi ?? "").trim();
    if (!doi) continue;
    const title = String(it.title ?? "").trim();
    const abstract = String(it.abstract ?? "").trim() || null;
    const published = it.date ? new Date(`${it.date}T00:00:00Z`) : null;
    const authors = String(it.authors ?? "")
      .split(/;/)
      .map((s) => s.trim())
      .filter(Boolean);

    const textBlob = `${title}\n${abstract ?? ""}\n${it.category ?? ""}`;
    const biomedical_score = Math.min(1, biomedicalWeight(textBlob) + 0.12);

    out.push({
      source: "biorxiv",
      external_id: doi,
      title,
      abstract,
      published_at: published,
      doi,
      url: `https://doi.org/${doi}`,
      journal: "bioRxiv",
      keywords: it.category ? [it.category] : [],
      authors,
      biomedical_score,
      raw: it,
    });
  }
  return out;
}
