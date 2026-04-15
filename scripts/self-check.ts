import assert from "assert";
import { computeSummaryConfidence } from "../src/services/ai/confidence";
import { quantitativeScore, recencyScore, compositeRanking } from "../src/services/ranking/signals";

const low = computeSummaryConfidence("Too short");
assert(low.confidence === "low" || low.confidence === "medium");

const high = computeSummaryConfidence(
  "Background. Methods. We enrolled 240 patients. The primary endpoint was met (HR 0.62, 95% CI 0.44-0.88, p=0.003). Results were consistent across subgroups. Limitations include single-site early phase design and short follow-up.",
);
assert(high.confidence === "high" || high.numeric >= 60);

assert(quantitativeScore("n=120 p<0.01 HR 0.5 95% CI") > 20);

const rNew = recencyScore(new Date().toISOString(), new Date().toISOString());
const rOld = recencyScore(new Date(Date.now() - 10 * 24 * 3600_000).toISOString(), new Date().toISOString());
assert(rNew > rOld);

const c = compositeRanking({
  recency: 80,
  quantitative: 80,
  keyword: 80,
  engagement: 80,
  biomedicalBoost: 80,
});
assert(c > 70 && c < 85);

console.log("self-check: ok");
