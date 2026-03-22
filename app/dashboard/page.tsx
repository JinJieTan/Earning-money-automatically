async function getSummary() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/dashboard/summary`, {
    headers: {
      "x-api-key": process.env.DASHBOARD_API_KEY ?? ""
    },
    cache: "no-store"
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as {
    totalUsd: number;
    successRate: number;
    byPlatform: Array<{ platform: string; total: number }>;
    recentLogs: Array<{ stage: string; message: string; created_at: string }>;
    taskStats: Array<{ status: string; count: number }>;
    state: { active_platform: string | null; active_stage: string };
  };
}

export default async function DashboardPage() {
  const data = await getSummary();

  if (!data) {
    return <main className="p-8 text-red-300">Dashboard 鉴权失败，请检查 `DASHBOARD_API_KEY`。</main>;
  }

  const progress = Math.min(100, (data.totalUsd / 100) * 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold">Agent Earner Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <p className="text-sm text-slate-300">累计收益</p>
          <p className="mt-2 text-3xl font-bold text-good">${data.totalUsd.toFixed(2)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full bg-good" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">目标进度 {progress.toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <p className="text-sm text-slate-300">任务成功率</p>
          <p className="mt-2 text-3xl font-bold text-accent">{(data.successRate * 100).toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <p className="text-sm text-slate-300">当前状态</p>
          <p className="mt-2 text-lg font-semibold">
            {data.state.active_platform ?? "none"} / {data.state.active_stage}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-3 text-lg font-semibold">平台收益贡献</h2>
          <div className="space-y-3">
            {data.byPlatform.map((item) => (
              <div key={item.platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.platform}</span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (item.total / Math.max(data.totalUsd, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-3 text-lg font-semibold">任务状态分布</h2>
          <ul className="space-y-2 text-sm text-slate-200">
            {data.taskStats.map((item) => (
              <li key={item.status} className="flex justify-between">
                <span>{item.status}</span>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h2 className="mb-3 text-lg font-semibold">最近操作日志</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {data.recentLogs.map((log, index) => (
            <li key={`${log.created_at}-${index}`} className="border-b border-white/5 pb-2">
              <span className="text-accent">[{log.stage}]</span> {log.message}
              <span className="ml-2 text-xs text-slate-500">{log.created_at}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
