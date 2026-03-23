import { getDb } from "@/lib/db";
import { Task } from "@/lib/types";

export function listRecentTasks(limit = 50): Task[] {
  return getDb()
    .prepare(`SELECT * FROM tasks ORDER BY id DESC LIMIT ?`)
    .all(limit) as Task[];
}

export function createTask(input: {
  platform: string;
  type: string;
  title: string;
  expected_usd?: number;
  source_url?: string;
}) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO tasks(platform, type, title, expected_usd, source_url)
     VALUES(@platform, @type, @title, @expected_usd, @source_url)`
  );

  const result = stmt.run({
    ...input,
    expected_usd: input.expected_usd ?? 0,
    source_url: input.source_url ?? null
  });

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid) as Task;
}

export function markTaskStatus(taskId: number, status: Task["status"], actualUsd = 0) {
  getDb()
    .prepare(
      `UPDATE tasks
       SET status = ?, actual_usd = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(status, actualUsd, taskId);
}

export function appendTaskLog(input: {
  taskId?: number;
  stage: string;
  message: string;
  screenshotPath?: string;
  decisionReason?: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO task_logs(task_id, stage, message, screenshot_path, decision_reason)
       VALUES(?, ?, ?, ?, ?)`
    )
    .run(
      input.taskId ?? null,
      input.stage,
      input.message,
      input.screenshotPath ?? null,
      input.decisionReason ?? null
    );
}

export function appendEarning(taskId: number, platform: string, amountUsd: number, note?: string) {
  getDb()
    .prepare(
      `INSERT INTO earnings(task_id, platform, amount_usd, note)
       VALUES(?, ?, ?, ?)`
    )
    .run(taskId, platform, amountUsd, note ?? null);
}

export function confirmEarning(input: {
  taskId: number;
  platform: string;
  amountUsd: number;
  note?: string;
}) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO earnings(task_id, platform, amount_usd, note)
       VALUES(?, ?, ?, ?)`
    ).run(input.taskId, input.platform, input.amountUsd, input.note ?? null);

    db.prepare(
      `UPDATE tasks
       SET actual_usd = COALESCE(actual_usd, 0) + ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(input.amountUsd, input.taskId);
  });

  tx();
}

export function upsertAgentState(input: {
  activePlatform?: string | null;
  activeStage: string;
  contextJson?: string;
}) {
  getDb()
    .prepare(
      `UPDATE agent_state
       SET active_platform = ?, active_stage = ?, context_json = COALESCE(?, context_json),
           last_heartbeat = datetime('now'), updated_at = datetime('now')
       WHERE id = 1`
    )
    .run(input.activePlatform ?? null, input.activeStage, input.contextJson ?? null);
}

export function getAgentState() {
  return getDb().prepare("SELECT * FROM agent_state WHERE id = 1").get() as {
    active_platform: string | null;
    active_stage: string;
    context_json: string;
    last_heartbeat: string;
  };
}

export function getDashboardSummary() {
  const db = getDb();

  const totals = db.prepare(`SELECT COALESCE(SUM(amount_usd), 0) AS total_usd FROM earnings`).get() as {
    total_usd: number;
  };

  const success = db
    .prepare(
      `SELECT
         COALESCE(AVG(CASE WHEN status IN ('completed','failed') THEN CASE WHEN status='completed' THEN 1 ELSE 0 END END), 0) AS success_rate
       FROM tasks`
    )
    .get() as { success_rate: number };

  const pipeline = db
    .prepare(
      `SELECT
         COALESCE(SUM(expected_usd), 0) AS expected_total,
         COALESCE(SUM(actual_usd), 0) AS actual_total
       FROM tasks
       WHERE status = 'completed'`
    )
    .get() as { expected_total: number; actual_total: number };

  const byPlatform = db
    .prepare(
      `SELECT platform, COALESCE(SUM(amount_usd), 0) AS total
       FROM earnings
       GROUP BY platform`
    )
    .all() as Array<{ platform: string; total: number }>;

  const recentLogs = db
    .prepare(
      `SELECT
         task_logs.id,
         task_logs.task_id,
         task_logs.stage,
         task_logs.message,
         task_logs.screenshot_path,
         task_logs.decision_reason,
         task_logs.created_at,
         tasks.platform AS platform,
         tasks.title AS task_title
       FROM task_logs
       LEFT JOIN tasks ON tasks.id = task_logs.task_id
       ORDER BY task_logs.id DESC
       LIMIT 80`
    )
    .all() as Array<{
      id: number;
      task_id: number | null;
      stage: string;
      message: string;
      screenshot_path: string | null;
      decision_reason: string | null;
      created_at: string;
      platform: string | null;
      task_title: string | null;
    }>;

  const taskStats = db
    .prepare(
      `SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`
    )
    .all() as Array<{ status: string; count: number }>;

  const errorSummary = db
    .prepare(
      `SELECT
         COALESCE(tasks.platform, 'system') AS platform,
         task_logs.message AS message,
         COUNT(*) AS count
       FROM task_logs
       LEFT JOIN tasks ON tasks.id = task_logs.task_id
       WHERE task_logs.stage = 'error'
       GROUP BY COALESCE(tasks.platform, 'system'), task_logs.message
       ORDER BY count DESC
       LIMIT 6`
    )
    .all() as Array<{ platform: string; message: string; count: number }>;

  const stageStats = db
    .prepare(
      `SELECT stage, COUNT(*) AS count
       FROM task_logs
       GROUP BY stage
       ORDER BY count DESC`
    )
    .all() as Array<{ stage: string; count: number }>;

  const hourlyActivityRaw = db
    .prepare(
      `SELECT strftime('%H', created_at) AS hour, COUNT(*) AS count
       FROM task_logs
       WHERE created_at >= datetime('now', '-24 hours')
       GROUP BY hour
       ORDER BY hour`
    )
    .all() as Array<{ hour: string; count: number }>;

  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const key = String(i).padStart(2, "0");
    const matched = hourlyActivityRaw.find((row) => row.hour === key);
    return { hour: key, count: matched?.count ?? 0 };
  });

  const platformTaskStats = db
    .prepare(
      `SELECT
         platform,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         COUNT(*) AS total
       FROM tasks
       GROUP BY platform`
    )
    .all() as Array<{ platform: string; completed: number; failed: number; total: number }>;

  const state = getAgentState();

  return {
    totalUsd: totals.total_usd,
    successRate: success.success_rate,
    pendingSettlementUsd: Math.max(0, pipeline.expected_total - pipeline.actual_total),
    byPlatform,
    recentLogs,
    taskStats,
    stageStats,
    errorSummary,
    hourlyActivity,
    platformTaskStats,
    state
  };
}

export function writeSnapshot() {
  const summary = getDashboardSummary();

  getDb()
    .prepare(
      `INSERT INTO snapshots(total_usd, task_success_rate, by_platform_json, active_platform, active_stage)
       VALUES(?, ?, ?, ?, ?)`
    )
    .run(
      summary.totalUsd,
      summary.successRate,
      JSON.stringify(summary.byPlatform),
      summary.state.active_platform,
      summary.state.active_stage
    );

  return summary;
}
