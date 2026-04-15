import { getServerEnv } from "@/lib/env";

export async function sendWeeklyDigestEmail(params: {
  to: string;
  html: string;
  subject: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    console.info("[email] RESEND_API_KEY missing; skipping send", { to: params.to, subject: params.subject });
    return { ok: false, reason: "missing_resend" };
  }
  const from = env.DIGEST_FROM_EMAIL ?? "digest@example.com";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false, reason: t.slice(0, 500) };
  }
  return { ok: true };
}

export function renderDigestHtml(papers: { title: string; url: string; one_liner: string | null }[]): string {
  const items = papers
    .map(
      (p) =>
        `<li><a href="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a><div style="color:#555;font-size:13px;margin-top:4px">${escapeHtml(
          p.one_liner ?? "",
        )}</div></li>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:640px">
    <h1>ResearchCard weekly digest</h1>
    <p>AI-assisted pointers to recent papers. Always verify against the original articles.</p>
    <ol>${items}</ol>
    <p style="font-size:12px;color:#666">You received this because you subscribed at ResearchCard.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
