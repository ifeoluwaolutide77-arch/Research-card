const TERMS = [
  "clinical",
  "patient",
  "trial",
  "therapy",
  "drug",
  "pharma",
  "cancer",
  "tumor",
  "protein",
  "gene",
  "cell",
  "immune",
  "vaccine",
  "mrna",
  "antibody",
  "enzyme",
  "receptor",
  "pathway",
  "biomarker",
  "mouse",
  "in vivo",
  "in vitro",
  "pharmacokinetic",
  "efficacy",
  "safety",
  "dose",
];

export function biomedicalWeight(text: string): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const term of TERMS) {
    if (t.includes(term)) hits += 1;
  }
  return Math.min(1, hits / 12);
}
