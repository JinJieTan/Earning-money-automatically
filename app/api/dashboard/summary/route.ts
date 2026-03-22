import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/http";
import { getDashboardSummary } from "@/lib/repo";
import { migrate } from "@/lib/schema";

export async function GET(req: NextRequest) {
  migrate();

  const auth = requireDashboardAuth(req);
  if (auth) return auth;

  return NextResponse.json(getDashboardSummary());
}
