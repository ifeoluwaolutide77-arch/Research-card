import "dotenv/config";
import { runIngestionPipeline } from "../src/services/ingestion/orchestrator";

async function main() {
  const { insertedOrUpdated } = await runIngestionPipeline({ perSource: 15 });
  console.log(`Ingestion complete. Rows touched: ${insertedOrUpdated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
