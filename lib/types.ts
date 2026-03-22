export type Platform = "fiverr" | "medium" | "upwork";

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Task {
  id: number;
  platform: Platform;
  type: string;
  title: string;
  status: TaskStatus;
  expected_usd: number;
  actual_usd: number;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}
