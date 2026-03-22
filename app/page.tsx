import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20">
      <div className="rounded-2xl border border-cyan-200/20 bg-panel/70 p-10 shadow-2xl backdrop-blur">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Agent Earner v1.3</p>
        <h1 className="mb-4 text-4xl font-semibold">AI Agent 自主创收实验平台</h1>
        <p className="max-w-2xl text-slate-300">
          目标：在最少人工干预下，从 $0 到 $100。当前代码包含任务持久化、Agent 调度、快照系统、Dashboard API 与基础可视化。
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-slate-900 transition hover:opacity-90"
          >
            打开 Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
