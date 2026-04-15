import type { PaperWithSummary } from "@/lib/types/models";
import { attachRankingSignals, filterPublishedToday, sortByComposite } from "./signals";
import type { PaperRecord } from "@/lib/types/models";

export type DiscoveryPayload = {
  top10Today: PaperWithSummary[];
  trending: PaperWithSummary[];
  breakthrough: PaperWithSummary | null;
};

export function buildDiscoveryLists(
  papers: PaperWithSummary[],
  allPaperRecords: PaperRecord[],
  now = new Date(),
): DiscoveryPayload {
  const ranked = sortByComposite(attachRankingSignals(papers));
  const todayRecords = filterPublishedToday(allPaperRecords.length ? allPaperRecords : papers, now);
  const todayIds = new Set(todayRecords.map((p) => p.id));
  const todayPapers = ranked.filter((p) => todayIds.has(p.id));
  const top10Today = (todayPapers.length ? todayPapers : ranked).slice(0, 10);

  const trending = ranked.slice(0, 12);

  const breakthrough =
    ranked.find((p) => {
      const q = p.ranking?.quantitative ?? 0;
      const k = p.ranking?.keyword ?? 0;
      return q >= 55 && k >= 40;
    }) ?? ranked[0] ?? null;

  return { top10Today, trending, breakthrough };
}
