import { NextRequest, NextResponse } from "next/server";
import { signDashboardToken } from "@/lib/auth";
import { isValidApiKey } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const apiKeyFromHeader = req.headers.get("x-api-key");
  const body = await req.json().catch(() => ({}));
  const apiKeyFromBody = typeof body.apiKey === "string" ? body.apiKey : null;
  const apiKey = apiKeyFromHeader ?? apiKeyFromBody;

  if (!isValidApiKey(apiKey)) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const token = signDashboardToken();
  return NextResponse.json({ token });
}
