import { getEnv } from "@/lib/env";

const blockedCommandPatterns = [
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bcurl\b.*\|/i,
  /\bwget\b.*\|/i,
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i
];

export function assertAllowedUrl(targetUrl: string) {
  const { hostname } = new URL(targetUrl);
  const allowed = getEnv().allowedDomains;
  const normalizedHost = hostname.toLowerCase();

  const pass = allowed.some((domain) => {
    return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
  });

  if (!pass) {
    throw new Error(`Blocked domain: ${hostname}`);
  }
}

export function assertSafeCommand(command: string) {
  for (const pattern of blockedCommandPatterns) {
    if (pattern.test(command)) {
      throw new Error(`Blocked command pattern: ${pattern}`);
    }
  }
}

export function redactSecrets(input: string) {
  const env = getEnv();
  return input
    .replaceAll(env.DASHBOARD_JWT_SECRET, "[REDACTED_SECRET]")
    .replaceAll(env.DASHBOARD_API_KEY, "[REDACTED_SECRET]")
    .replaceAll(env.LLM_API_KEY, "[REDACTED_SECRET]");
}
