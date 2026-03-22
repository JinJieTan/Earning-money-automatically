import "dotenv/config";
import { migrate } from "./lib/schema";
import { startSchedulers } from "./lib/cron";
import { appendTaskLog } from "./lib/repo";

async function main() {
  migrate();
  startSchedulers();
  appendTaskLog({ stage: "system", message: "Agent process started." });
  console.log("Agent process started. Schedulers are active.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
