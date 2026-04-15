import { XMLParser } from "fast-xml-parser";
import type { PaperSource } from "@/lib/types/models";
import { biomedicalWeight } from "@/services/ingestion/biomedical";

export type IngestedPaper = {
  source: PaperSource;
  external_id: string;
  title: string;
  abstract: string | null;
  published_at: Date | null;
  doi: string | null;
  url: string;
  journal: string | null;
  keywords: string[];
  authors: string[];
  biomedical_score: number;
  raw: unknown;
};

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

async function fetchText(url: string, retries = 3): Promise<string> {
  let last: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("PubMed fetch failed");
}

function pickArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function ingestPubMedRecent(maxResults = 25): Promise<IngestedPaper[]> {
  const term = encodeURIComponent(`hasabstract[text] AND (biomedical research[tiab] OR clinical trial[tiab] OR pharmacology[MeSH Terms])`);
  const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=${maxResults}&sort=pub+date&term=${term}`;
  const searchXml = await fetchText(esearch);
  const searchJson = parser.parse(searchXml) as {
    eSearchResult?: { IdList?: { Id?: string | string[] } };
  };
  const ids = pickArray(searchJson.eSearchResult?.IdList?.Id)
    .map(String)
    .filter(Boolean);
  if (!ids.length) return [];

  const idParam = ids.join(",");
  const efetch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idParam}&retmode=xml`;
  const fetchXml = await fetchText(efetch);
  const doc = parser.parse(fetchXml) as {
    PubmedArticleSet?: { PubmedArticle?: unknown | unknown[] };
  };
  const articles = pickArray(doc.PubmedArticleSet?.PubmedArticle);

  const out: IngestedPaper[] = [];
  for (const raw of articles) {
    const article = raw as {
      MedlineCitation?: {
        PMID?: { ["#text"]?: string; ["@_Version"]?: string };
        Article?: {
          ArticleTitle?: string | { ["#text"]?: string };
          Abstract?: { AbstractText?: string | { ["#text"]?: string } | Array<string | { ["#text"]?: string }> };
          Journal?: { Title?: string };
          AuthorList?: { Author?: unknown | unknown[] };
          ELocationID?: { ["#text"]?: string; ["@_EIdType"]?: string } | Array<{
            ["#text"]?: string;
            ["@_EIdType"]?: string;
          }>;
        };
        DateCompleted?: { Year?: string; Month?: string; Day?: string };
        ArticleDate?: { Year?: string; Month?: string; Day?: string };
        DateRevised?: { Year?: string; Month?: string; Day?: string };
      };
      PubmedData?: { History?: { PubMedPubDate?: unknown | unknown[] } };
    };

    const pmid = String(article.MedlineCitation?.PMID?.["#text"] ?? article.MedlineCitation?.PMID ?? "").trim();
    if (!pmid) continue;

    const art = article.MedlineCitation?.Article;
    const titleNode = art?.ArticleTitle;
    const title =
      typeof titleNode === "string"
        ? titleNode
        : typeof titleNode === "object" && titleNode
          ? String(titleNode["#text"] ?? "")
          : "";

    const absNode = art?.Abstract?.AbstractText;
    const abstractParts = pickArray(absNode).map((n) =>
      typeof n === "string" ? n : String((n as { ["#text"]?: string })?.["#text"] ?? ""),
    );
    const abstract = abstractParts.join("\n").trim() || null;

    const journal = art?.Journal?.Title ? String(art.Journal.Title) : null;

    const authorsRaw = pickArray(art?.AuthorList?.Author);
    const authors = authorsRaw
      .map((a) => {
        const au = a as { LastName?: string; ForeName?: string; CollectiveName?: string };
        if (au.CollectiveName) return String(au.CollectiveName);
        const ln = au.LastName ? String(au.LastName) : "";
        const fn = au.ForeName ? String(au.ForeName) : "";
        return `${fn} ${ln}`.trim();
      })
      .filter(Boolean);

    const elocs = pickArray(art?.ELocationID);
    let doi: string | null = null;
    for (const e of elocs) {
      const node = e as { ["#text"]?: string; ["@_EIdType"]?: string };
      if (String(node["@_EIdType"]).toLowerCase() === "doi" && node["#text"]) {
        doi = String(node["#text"]);
        break;
      }
    }

    const hist = pickArray(article.PubmedData?.History?.PubMedPubDate);
    let published: Date | null = null;
    for (const h of hist) {
      const d = h as { ["@_PubStatus"]?: string; Year?: string; Month?: string; Day?: string };
      if (String(d["@_PubStatus"]).toLowerCase() === "pubmed" || String(d["@_PubStatus"]).toLowerCase() === "medline") {
        const y = Number(d.Year);
        const m = Number(d.Month);
        const day = Number(d.Day);
        if (y > 1900) published = new Date(Date.UTC(y, Math.max(0, m - 1), day || 1));
      }
    }
    if (!published) {
      const y = Number(article.MedlineCitation?.ArticleDate?.Year ?? article.MedlineCitation?.DateRevised?.Year);
      const m = Number(article.MedlineCitation?.ArticleDate?.Month ?? article.MedlineCitation?.DateRevised?.Month);
      const d = Number(article.MedlineCitation?.ArticleDate?.Day ?? article.MedlineCitation?.DateRevised?.Day);
      if (y > 1900) published = new Date(Date.UTC(y, Math.max(0, m - 1), d || 1));
    }

    const textBlob = `${title}\n${abstract ?? ""}`;
    const biomedical_score = biomedicalWeight(textBlob);

    out.push({
      source: "pubmed",
      external_id: pmid,
      title,
      abstract,
      published_at: published,
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      journal,
      keywords: [],
      authors,
      biomedical_score,
      raw,
    });
  }

  return out;
}
