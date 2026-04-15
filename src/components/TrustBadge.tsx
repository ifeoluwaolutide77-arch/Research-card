import type { SummaryConfidence } from "@/lib/types/models";

const copy: Record<SummaryConfidence, string> = {
  high: "Summary confidence: High — abstract is relatively detailed and includes quantitative cues.",
  medium: "Summary confidence: Medium — interpret cautiously; key numeric claims may be sparse.",
  low: "Summary confidence: Low — abstract is short or vague; treat all bullets as tentative.",
};

export function TrustBadge(props: {
  confidence: SummaryConfidence | undefined;
  sourceLabel?: string | null;
}) {
  const c = props.confidence ?? "medium";
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <div className="font-semibold">{copy[c]}</div>
      <div className="mt-1 text-xs text-amber-900/80">
        {props.sourceLabel ?? "Based on abstract only"} · All structured fields are AI-generated and may be incomplete.
      </div>
    </div>
  );
}
