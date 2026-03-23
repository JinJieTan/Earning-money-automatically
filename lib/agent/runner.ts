import { askModel } from "@/lib/agent/model";
import { runFiverrTask } from "@/lib/agent/platforms/fiverr";
import { runMediumTask } from "@/lib/agent/platforms/medium";
import { runUpworkTask } from "@/lib/agent/platforms/upwork";
import {
  appendTaskLog,
  createTask,
  listRecentTasks,
  markTaskStatus,
  upsertAgentState
} from "@/lib/repo";

type AgentControl = {
  enabled: boolean;
};

const control: AgentControl = {
  enabled: true
};

function pickTask() {
  const pending = listRecentTasks(100).find((t) => t.status === "pending");
  return pending ?? null;
}

async function createSeedTaskByModel() {
  try {
    const idea = await askModel({
      system:
        "You are an ops planner for an autonomous freelancing/content agent. Return concise JSON only.",
      prompt: [
        "Create one legal and policy-compliant task idea for Fiverr/Medium/Upwork.",
        "Fields: platform(fiverr|medium|upwork), type, title, expected_usd.",
        "Do not include deception, credential abuse, or ToS violations."
      ].join("\n"),
      maxTokens: 180
    });

    const cleaned = idea.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      platform: "fiverr" | "medium" | "upwork";
      type: string;
      title: string;
      expected_usd: number;
    };

    return createTask({
      platform: parsed.platform,
      type: parsed.type,
      title: parsed.title,
      expected_usd: Math.max(0, Number(parsed.expected_usd) || 0)
    });
  } catch {
    return createTask({
      platform: "medium",
      type: "article",
      title: "Write one SEO blog draft for AI tooling niche",
      expected_usd: 8
    });
  }
}

export async function runAgentTick({ dryRun = true }: { dryRun?: boolean } = {}) {
  if (!control.enabled) {
    upsertAgentState({ activeStage: "paused", activePlatform: null });
    return { skipped: true, reason: "Agent paused" };
  }

  upsertAgentState({ activeStage: "planning", activePlatform: null });

  let task = pickTask();
  if (!task) {
    task = await createSeedTaskByModel();
    appendTaskLog({
      taskId: task.id,
      stage: "planning",
      message: `Seed task created: ${task.title}`
    });
  }

  upsertAgentState({ activeStage: "executing", activePlatform: task.platform });
  markTaskStatus(task.id, "running");

  try {
    let result: { ok: boolean; note: string };

    if (task.platform === "fiverr") {
      result = await runFiverrTask(dryRun);
    } else if (task.platform === "medium") {
      result = await runMediumTask(dryRun);
    } else {
      result = await runUpworkTask(dryRun);
    }

    appendTaskLog({
      taskId: task.id,
      stage: "execution",
      message: result.note,
      decisionReason: `platform=${task.platform} dryRun=${String(dryRun)}`
    });

    if (result.ok) {
      appendTaskLog({
        taskId: task.id,
        stage: "payment",
        message:
          "Execution completed. Waiting for real payout confirmation before recording earnings."
      });
    }

    markTaskStatus(task.id, result.ok ? "completed" : "failed", 0);
    upsertAgentState({ activeStage: "idle", activePlatform: null });

    return {
      skipped: false,
      ok: result.ok,
      estimatedUsd: result.ok ? task.expected_usd : 0,
      confirmedUsd: 0
    };
  } catch (error) {
    markTaskStatus(task.id, "failed", 0);
    appendTaskLog({
      taskId: task.id,
      stage: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    });

    upsertAgentState({ activeStage: "error", activePlatform: task.platform });
    throw error;
  }
}

export function setAgentEnabled(enabled: boolean) {
  control.enabled = enabled;
  upsertAgentState({ activeStage: enabled ? "idle" : "paused", activePlatform: null });
}

export function getAgentControl() {
  return { ...control };
}
