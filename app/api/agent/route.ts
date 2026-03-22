import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAuth } from "@/lib/http";
import { getAgentControl, runAgentTick, setAgentEnabled } from "@/lib/agent/runner";
import { getAgentState } from "@/lib/repo";
import { migrate } from "@/lib/schema";

const BodySchema = z.object({
  action: z.enum(["start", "stop", "tick"]).default("tick"),
  dryRun: z.boolean().optional()
});

export async function GET(req: NextRequest) {
  migrate();
  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  return NextResponse.json({
    control: getAgentControl(),
    state: getAgentState()
  });
}

export async function POST(req: NextRequest) {
  migrate();
  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, dryRun } = parsed.data;
  if (action === "start") {
    setAgentEnabled(true);
    return NextResponse.json({ ok: true, control: getAgentControl() });
  }
  if (action === "stop") {
    setAgentEnabled(false);
    return NextResponse.json({ ok: true, control: getAgentControl() });
  }

  const result = await runAgentTick({ dryRun: dryRun ?? true });
  return NextResponse.json({ ok: true, result });
}
