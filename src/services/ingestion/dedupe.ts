import type { PaperSource } from "@/lib/types/models";

export function dedupeHash(source: PaperSource, externalId: string): string {
  return `${source}:${externalId}`.toLowerCase();
}

export function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const d = doi.trim();
  if (!d) return null;
  return d.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
}

export function crossSourceDedupeKey(doi: string | null, url: string, source: PaperSource, externalId: string): string {
  const n = normalizeDoi(doi);
  if (n) return `doi:${n}`;
  return dedupeHash(source, externalId);
}
