export type PaperSource = "pubmed" | "arxiv" | "biorxiv";
export type SummaryConfidence = "high" | "medium" | "low";

export type PaperRecord = {
  id: string;
  source: PaperSource;
  external_id: string;
  title: string;
  abstract: string | null;
  published_at: string | null;
  doi: string | null;
  url: string;
  journal: string | null;
  keywords: string[];
  biomedical_score: number;
  created_at: string;
};

export type PaperSummaryRecord = {
  paper_id: string;
  one_liner: string | null;
  problem: string | null;
  objective: string | null;
  methods: string | null;
  results: string | null;
  limitations: string | null;
  improvements: string | null;
  tags: string[];
  model: string | null;
  ai_disclaimer: string;
  source_label: string;
  confidence: SummaryConfidence;
  confidence_numeric: number | null;
  uncertain: boolean;
  uncertainty_notes?: string | null;
};

export type AuthorRecord = {
  id: string;
  name: string;
  normalized_name: string;
  orcid: string | null;
  research_tags: string[];
};

export type PaperWithSummary = PaperRecord & {
  summary: PaperSummaryRecord | null;
  authors: { id: string; name: string; position: number }[];
  engagement: { thumbs_up: number; thumbs_down: number };
  ranking?: {
    recency: number;
    quantitative: number;
    keyword: number;
    engagement: number;
    composite: number;
  };
};

export type AiStructuredSummary = {
  one_liner: string;
  problem: string;
  objective: string;
  methods: string;
  results: string;
  limitations: string;
  improvements: string;
  tags: string[];
  uncertain: boolean;
  uncertainty_notes: string;
};
