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
  const confidenceWidth: Record<SummaryConfidence, string> = {
    high: "92%",
    medium: "62%",
    low: "34%",
  };
  const confidenceTone: Record<SummaryConfidence, string> = {
    high: "bg-emerald-300",
    medium: "bg-amber-300",
    low: "bg-rose-300",
  };

  return (
    <div className="rounded-xl border border-cyan-100/20 bg-slate-950/45 p-3 text-sm text-cyan-50">
      <div className="font-semibold text-cyan-100">{copy[c]}</div>
      <div className="mt-2 h-2 rounded-full bg-cyan-100/10">
        <div
          className={`h-2 rounded-full ${confidenceTone[c]} transition-all duration-500`}
          style={{ width: confidenceWidth[c] }}
          aria-hidden
        />
      </div>
      <div className="mt-2 text-xs text-cyan-100/70">
        {props.sourceLabel ?? "Based on abstract only"} · All structured fields are AI-generated and may be incomplete.
      </div>
    </div>
  );
}
