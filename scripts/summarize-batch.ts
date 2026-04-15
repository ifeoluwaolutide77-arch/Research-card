import "dotenv/config";
import { getPool } from "../src/lib/db/pool";
import { listPapersMissingSummaries } from "../src/lib/db/summaries.repository";
import { summarizePaperById } from "../src/services/batch/runSummarization";

async function main() {
  const pool = getPool();
  const batch = Number(process.env.SUMMARIZE_BATCH_SIZE ?? 12);
  const ids = await listPapersMissingSummaries(pool, batch);
  if (!ids.length) {
    console.log("No papers pending summarization.");
    return;
  }
  for (const id of ids) {
    try {
      await summarizePaperById(pool, id);
      console.log("Summarized", id);
    } catch (e) {
      console.error("Failed", id, e);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
