import type { PaperRecord, PaperWithSummary } from "@/lib/types/models";

const QUANT_PATTERNS = [
  /\b\d+(?:\.\d+)?%/g,
  /\bn\s*=\s*\d+/gi,
  /\bp\s*[<>=]\s*0\.\d+/gi,
  /\b\d+(?:\.\d+)?\s*(?:mg|kg|ml|μm|mm|nm|mM|μM|nM|CI|OR|HR|RR)\b/gi,
  /\b(?:95%\s*CI|confidence interval)\b/gi,
];

const BIOMED_KEYWORDS = [
  "clinical",
  "patient",
  "trial",
  "therapy",
  "drug",
  "cancer",
  "tumor",
  "protein",
  "gene",
  "cell",
  "mouse",
  "pharma",
  "biomarker",
  "immune",
  "vaccine",
  "mrna",
  "antibody",
  "enzyme",
  "receptor",
  "pathway",
  "in vitro",
  "in vivo",
];

export function recencyScore(publishedAt: string | null, createdAt: string): number {
  const t = publishedAt ? new Date(publishedAt).getTime() : new Date(createdAt).getTime();
  const ageHours = Math.max(1, (Date.now() - t) / 3_600_000);
  return 100 / Math.pow(ageHours, 0.35);
}

export function quantitativeScore(text: string | null | undefined): number {
  if (!text) return 0;
  let hits = 0;
  for (const p of QUANT_PATTERNS) {
    const m = text.match(p);
    if (m) hits += m.length;
  }
  const density = hits / Math.max(1, text.split(/\s+/).length / 100);
  return Math.min(100, hits * 4 + density * 10);
}

export function keywordScore(title: string, abstract: string | null, keywords: string[]): number {
  const blob = `${title}\n${abstract ?? ""}\n${keywords.join(" ")}`.toLowerCase();
  let score = 0;
  for (const k of BIOMED_KEYWORDS) {
    if (blob.includes(k)) score += 6;
  }
  return Math.min(100, score);
}

export function engagementScore(thumbsUp: number, thumbsDown: number): number {
  const net = thumbsUp - thumbsDown;
  const mag = thumbsUp + thumbsDown;
  const wilson = mag === 0 ? 0 : (net + 1) / (mag + 2);
  return Math.max(0, Math.min(100, 50 + wilson * 50 + Math.log1p(mag) * 3));
}

export function compositeRanking(input: {
  recency: number;
  quantitative: number;
  keyword: number;
  engagement: number;
  biomedicalBoost: number;
}): number {
  const wR = 0.28;
  const wQ = 0.22;
  const wK = 0.22;
  const wE = 0.18;
  const wB = 0.1;
  return (
    input.recency * wR +
    input.quantitative * wQ +
    input.keyword * wK +
    input.engagement * wE +
    input.biomedicalBoost * wB
  );
}

export function attachRankingSignals(papers: PaperWithSummary[]): PaperWithSummary[] {
  return papers.map((p) => {
    const recency = recencyScore(p.published_at, p.created_at);
    const quantitative = quantitativeScore(p.abstract);
    const keyword = keywordScore(p.title, p.abstract, p.keywords);
    const engagement = engagementScore(p.engagement.thumbs_up, p.engagement.thumbs_down);
    const biomedicalBoost = Math.min(100, p.biomedical_score * 100);
    const composite = compositeRanking({
      recency,
      quantitative,
      keyword,
      engagement,
      biomedicalBoost,
    });
    return {
      ...p,
      ranking: { recency, quantitative, keyword, engagement, composite },
    };
  });
}

export function sortByComposite(papers: PaperWithSummary[]): PaperWithSummary[] {
  return [...papers].sort((a, b) => (b.ranking?.composite ?? 0) - (a.ranking?.composite ?? 0));
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function filterPublishedToday(papers: PaperRecord[], now = new Date()): PaperRecord[] {
  return papers.filter((p) => {
    const t = p.published_at ? new Date(p.published_at) : new Date(p.created_at);
    return isSameCalendarDay(t, now);
  });
}
