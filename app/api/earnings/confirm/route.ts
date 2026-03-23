import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAuth } from "@/lib/http";
import { appendTaskLog, confirmEarning } from "@/lib/repo";
import { migrate } from "@/lib/schema";

const ConfirmSchema = z.object({
  taskId: z.number().int().positive(),
  platform: z.enum(["fiverr", "medium", "upwork"]),
  amountUsd: z.number().positive(),
  note: z.string().max(300).optional()
});

export async function POST(req: NextRequest) {
  migrate();
  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  const raw = await req.json().catch(() => null);
  const parsed = ConfirmSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  confirmEarning(parsed.data);
  appendTaskLog({
    taskId: parsed.data.taskId,
    stage: "payment",
    message: `Confirmed payout: $${parsed.data.amountUsd.toFixed(2)} on ${parsed.data.platform}`,
    decisionReason: parsed.data.note
  });

  return NextResponse.json({ ok: true });
}
