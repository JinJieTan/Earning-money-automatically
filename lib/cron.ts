import cron from "node-cron";
import { getEnv } from "@/lib/env";
import { runAgentTick } from "@/lib/agent/runner";
import { appendTaskLog, writeSnapshot } from "@/lib/repo";

let started = false;

export function startSchedulers() {
  if (started) return;
  started = true;

  const env = getEnv();
  const dryRun = process.env.AGENT_DRY_RUN !== "false";

  cron.schedule(env.AGENT_TICK_CRON, async () => {
    try {
      const result = await runAgentTick({ dryRun });
      appendTaskLog({
        stage: "tick",
        message: `Tick finished: ${JSON.stringify(result)}`
      });
    } catch (error) {
      appendTaskLog({
        stage: "error",
        message: error instanceof Error ? error.message : "Unknown tick error"
      });
    }
  });

  cron.schedule(env.SNAPSHOT_CRON, () => {
    try {
      const snap = writeSnapshot();
      appendTaskLog({
        stage: "snapshot",
        message: `Snapshot saved: total=${snap.totalUsd.toFixed(2)} successRate=${snap.successRate.toFixed(2)}`
      });
    } catch (error) {
      appendTaskLog({
        stage: "error",
        message: error instanceof Error ? error.message : "Unknown snapshot error"
      });
    }
  });
}
