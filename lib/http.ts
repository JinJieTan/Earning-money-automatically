import { NextRequest, NextResponse } from "next/server";
import { isValidApiKey, verifyDashboardToken } from "@/lib/auth";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function requireDashboardAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");

  if (isValidApiKey(apiKey)) {
    return null;
  }

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized();
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    verifyDashboardToken(token);
    return null;
  } catch {
    return unauthorized("Invalid token");
  }
}
