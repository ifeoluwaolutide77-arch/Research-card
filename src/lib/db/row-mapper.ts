import type { PaperRecord, PaperSource } from "@/lib/types/models";

export type RowPaper = {
  id: string;
  source: PaperSource;
  external_id: string;
  title: string;
  abstract: string | null;
  published_at: Date | null;
  doi: string | null;
  url: string;
  journal: string | null;
  keywords: string[];
  biomedical_score: string | number;
  created_at: Date;
};

export function mapPaperRow(row: RowPaper): PaperRecord {
  return {
    id: row.id,
    source: row.source,
    external_id: row.external_id,
    title: row.title,
    abstract: row.abstract,
    published_at: row.published_at ? row.published_at.toISOString() : null,
    doi: row.doi,
    url: row.url,
    journal: row.journal,
    keywords: row.keywords ?? [],
    biomedical_score: Number(row.biomedical_score),
    created_at: row.created_at.toISOString(),
  };
}
