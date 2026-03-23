"use client";

import { useMemo, useState } from "react";

type LogItem = {
  id: number;
  task_id: number | null;
  stage: string;
  message: string;
  screenshot_path: string | null;
  decision_reason: string | null;
  created_at: string;
  platform: string | null;
  task_title: string | null;
};

const stageColors: Record<string, string> = {
  planning: "bg-sky-400/20 text-sky-200",
  execution: "bg-emerald-400/20 text-emerald-200",
  payment: "bg-amber-400/20 text-amber-200",
  tick: "bg-indigo-400/20 text-indigo-200",
  snapshot: "bg-cyan-400/20 text-cyan-100",
  error: "bg-rose-500/20 text-rose-200"
};

export function LogStream({ logs }: { logs: LogItem[] }) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const stageOptions = useMemo(() => {
    return ["all", ...Array.from(new Set(logs.map((l) => l.stage)))];
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const stagePass = stageFilter === "all" || log.stage === stageFilter;
      const keyword = search.trim().toLowerCase();
      const keywordPass =
        keyword.length === 0 ||
        log.message.toLowerCase().includes(keyword) ||
        (log.task_title ?? "").toLowerCase().includes(keyword) ||
        (log.platform ?? "").toLowerCase().includes(keyword);
      return stagePass && keywordPass;
    });
  }, [logs, search, stageFilter]);

  return (
    <section className="glass fade-in rounded-2xl p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">事件流</h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm"
          >
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="筛选关键词（平台/任务/消息）"
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <ul className="max-h-[520px] space-y-3 overflow-auto pr-1">
        {filtered.map((log) => (
          <li key={log.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-1 ${stageColors[log.stage] ?? "bg-white/10 text-white"}`}>
                {log.stage}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-slate-200">
                {log.platform ?? "system"}
              </span>
              {log.task_id ? (
                <span className="font-mono text-slate-400">task#{log.task_id}</span>
              ) : null}
              <span className="ml-auto font-mono text-slate-500">{log.created_at}</span>
            </div>
            {log.task_title ? <p className="mb-1 text-sm text-slate-300">{log.task_title}</p> : null}
            <p className="text-sm text-slate-100">{log.message}</p>
            {log.decision_reason ? (
              <details className="mt-2 text-xs text-slate-400">
                <summary className="cursor-pointer select-none">决策依据</summary>
                <p className="mt-1 whitespace-pre-wrap">{log.decision_reason}</p>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
