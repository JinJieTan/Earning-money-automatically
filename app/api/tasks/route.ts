import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAuth } from "@/lib/http";
import { createTask, listRecentTasks } from "@/lib/repo";
import { migrate } from "@/lib/schema";

const CreateTaskSchema = z.object({
  platform: z.enum(["fiverr", "medium", "upwork"]),
  type: z.string().min(1),
  title: z.string().min(1),
  expected_usd: z.number().min(0).optional(),
  source_url: z.string().url().optional()
});

export async function GET(req: NextRequest) {
  migrate();
  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  return NextResponse.json({ tasks: listRecentTasks(100) });
}

export async function POST(req: NextRequest) {
  migrate();
  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  const raw = await req.json().catch(() => null);
  const parsed = CreateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = createTask(parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
