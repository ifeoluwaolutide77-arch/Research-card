import type { SummaryConfidence } from "@/lib/types/models";

export type ConfidenceResult = {
  confidence: SummaryConfidence;
  numeric: number;
};

export function computeSummaryConfidence(abstract: string | null | undefined): ConfidenceResult {
  const text = (abstract ?? "").trim();
  if (!text) {
    return { confidence: "low", numeric: 15 };
  }
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasNumbers = /\d/.test(text);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const clarity =
    avgWordsPerSentence >= 12 && avgWordsPerSentence <= 35 && sentenceCount >= 2 ? 30 : 12;

  let score = 20;
  if (wordCount >= 120) score += 25;
  else if (wordCount >= 80) score += 18;
  else if (wordCount >= 50) score += 10;
  else score += 4;

  if (hasNumbers) score += 20;
  const quantHits = (text.match(/\b\d+(?:\.\d+)?%|\bp\s*[<>=]\b|\bn\s*=\s*\d+/gi) ?? []).length;
  score += Math.min(20, quantHits * 5);
  score += clarity;

  const numeric = Math.max(0, Math.min(100, score));
  let confidence: SummaryConfidence = "medium";
  if (numeric >= 72) confidence = "high";
  else if (numeric <= 42) confidence = "low";
  return { confidence, numeric };
}
