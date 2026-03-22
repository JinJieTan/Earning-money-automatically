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

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(amount_usd), 0) AS total_usd,
         COALESCE(AVG(CASE WHEN status IN ('completed','failed') THEN CASE WHEN status='completed' THEN 1 ELSE 0 END END), 0) AS success_rate
       FROM tasks
       LEFT JOIN earnings ON earnings.task_id = tasks.id`
    )
    .get() as { total_usd: number; success_rate: number };

  const byPlatform = db
    .prepare(
      `SELECT platform, COALESCE(SUM(amount_usd), 0) AS total
       FROM earnings
       GROUP BY platform`
    )
    .all() as Array<{ platform: string; total: number }>;

  const recentLogs = db
    .prepare(
      `SELECT stage, message, created_at FROM task_logs ORDER BY id DESC LIMIT 25`
    )
    .all();

  const taskStats = db
    .prepare(
      `SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`
    )
    .all() as Array<{ status: string; count: number }>;

  const state = getAgentState();

  return {
    totalUsd: totals.total_usd,
    successRate: totals.success_rate,
    byPlatform,
    recentLogs,
    taskStats,
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
