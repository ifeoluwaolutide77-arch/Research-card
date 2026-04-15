import type { PaperWithSummary } from "@/lib/types/models";
import { ResearchCard } from "@/components/ResearchCard";

export function ExpandedCard(props: { paper: PaperWithSummary }) {
  return <ResearchCard paper={props.paper} compact={false} />;
}
