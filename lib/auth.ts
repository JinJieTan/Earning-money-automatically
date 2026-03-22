import jwt from "jsonwebtoken";
import { getEnv } from "@/lib/env";

export interface DashboardClaims {
  role: "admin";
}

export function signDashboardToken() {
  const env = getEnv();
  return jwt.sign({ role: "admin" } satisfies DashboardClaims, env.DASHBOARD_JWT_SECRET, {
    expiresIn: "12h"
  });
}

export function verifyDashboardToken(token: string) {
  const env = getEnv();
  return jwt.verify(token, env.DASHBOARD_JWT_SECRET) as DashboardClaims;
}

export function isValidApiKey(key: string | null) {
  if (!key) return false;
  return key === getEnv().DASHBOARD_API_KEY;
}
