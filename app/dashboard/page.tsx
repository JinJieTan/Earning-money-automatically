import { LogStream } from "@/components/dashboard/log-stream";

type SummaryResponse = {
  totalUsd: number;
  successRate: number;
  pendingSettlementUsd: number;
  byPlatform: Array<{ platform: string; total: number }>;
  recentLogs: Array<{
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
  taskStats: Array<{ status: string; count: number }>;
  stageStats: Array<{ stage: string; count: number }>;
  errorSummary: Array<{ platform: string; message: string; count: number }>;
  hourlyActivity: Array<{ hour: string; count: number }>;
  platformTaskStats: Array<{ platform: string; completed: number; failed: number; total: number }>;
  state: { active_platform: string | null; active_stage: string };
};

async function getSummary() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/dashboard/summary`, {
    headers: {
      "x-api-key": process.env.DASHBOARD_API_KEY ?? ""
    },
    cache: "no-store"
  });

  if (!res.ok) return null;
  return (await res.json()) as SummaryResponse;
}

function getHeatColor(count: number, max: number) {
  if (count <= 0) return "bg-slate-800/70";
  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.66) return "bg-cyan-300/80";
  if (ratio > 0.33) return "bg-cyan-500/70";
  return "bg-cyan-800/70";
}

export default async function DashboardPage() {
  const data = await getSummary();

  if (!data) {
    return <main className="p-8 text-red-300">Dashboard 鉴权失败，请检查 `DASHBOARD_API_KEY`。</main>;
  }

  const progress = Math.min(100, (data.totalUsd / 100) * 100);
  const maxHourCount = Math.max(...data.hourlyActivity.map((h) => h.count), 0);
  const completed = data.taskStats.find((t) => t.status === "completed")?.count ?? 0;
  const failed = data.taskStats.find((t) => t.status === "failed")?.count ?? 0;
  const running = data.taskStats.find((t) => t.status === "running")?.count ?? 0;
  const pending = data.taskStats.find((t) => t.status === "pending")?.count ?? 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-6 py-8">
      <header className="fade-in flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Agent Earner Control Board</p>
        <h1 className="text-3xl font-semibold">运营看板</h1>
        <p className="text-sm text-slate-300">
          当前状态：<span className="text-cyan-200">{data.state.active_platform ?? "none"}</span> /{" "}
          <span className="text-cyan-200">{data.state.active_stage}</span>
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="glass fade-in rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Confirmed Revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">${data.totalUsd.toFixed(2)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700/90">
            <div className="h-full bg-emerald-400" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">目标进度 {progress.toFixed(1)}%</p>
        </div>

        <div className="glass fade-in rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Pending Settlement</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">${data.pendingSettlementUsd.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-500">执行已完成但尚未确认到账</p>
        </div>

        <div className="glass fade-in rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Task Success</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{(data.successRate * 100).toFixed(1)}%</p>
          <p className="mt-2 text-xs text-slate-500">
            completed {completed} / failed {failed}
          </p>
        </div>

        <div className="glass fade-in rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Pipeline</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
            <span className="rounded-full bg-cyan-700/40 px-2 py-1">pending {pending}</span>
            <span className="rounded-full bg-indigo-700/40 px-2 py-1">running {running}</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">按任务生命周期自动更新</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass fade-in rounded-2xl p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">平台执行表现</h2>
          <div className="space-y-3">
            {data.platformTaskStats.map((row) => {
              const success = row.total > 0 ? (row.completed / row.total) * 100 : 0;
              return (
                <div key={row.platform} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">{row.platform}</span>
                    <span className="text-slate-300">
                      total {row.total} / success {success.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${success}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass fade-in rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold">错误看板</h2>
          <ul className="space-y-2 text-sm">
            {data.errorSummary.length === 0 ? (
              <li className="text-slate-400">暂无错误记录</li>
            ) : (
              data.errorSummary.map((item, idx) => (
                <li key={`${item.platform}-${idx}`} className="rounded-lg border border-rose-300/15 bg-rose-950/20 p-2">
                  <p className="text-xs text-rose-200">
                    {item.platform} · {item.count}次
                  </p>
                  <p className="mt-1 text-slate-200">{item.message}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass fade-in rounded-2xl p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">24h 活动热力</h2>
          <div className="grid grid-cols-12 gap-2">
            {data.hourlyActivity.map((item) => (
              <div key={item.hour} className="flex flex-col items-center gap-1">
                <div
                  title={`${item.hour}:00 - ${item.count} events`}
                  className={`h-8 w-full rounded ${getHeatColor(item.count, maxHourCount)}`}
                />
                <span className="text-[10px] text-slate-500">{item.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass fade-in rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold">流程阶段分布</h2>
          <ul className="space-y-2 text-sm">
            {data.stageStats.map((row) => (
              <li key={row.stage} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                <span>{row.stage}</span>
                <span className="font-mono text-slate-300">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LogStream logs={data.recentLogs} />
    </main>
  );
}
