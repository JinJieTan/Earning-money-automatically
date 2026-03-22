import { z } from "zod";

const EnvSchema = z.object({
  LLM_BASE_URL: z.string().url(),
  LLM_MODEL_NAME: z.string().min(1),
  LLM_API_KEY: z.string().min(1),
  PAYPAL_EMAIL: z.string().email(),
  SQLITE_PATH: z.string().min(1),
  DASHBOARD_JWT_SECRET: z.string().min(16),
  DASHBOARD_API_KEY: z.string().min(16),
  ALLOWED_DOMAINS: z.string().min(1),
  AGENT_TICK_CRON: z.string().default("*/5 * * * *"),
  SNAPSHOT_CRON: z.string().default("*/30 * * * *")
});

export type AppEnv = z.infer<typeof EnvSchema> & { allowedDomains: string[] };

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.parse({
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    LLM_MODEL_NAME: process.env.LLM_MODEL_NAME,
    LLM_API_KEY: process.env.LLM_API_KEY,
    PAYPAL_EMAIL: process.env.PAYPAL_EMAIL,
    SQLITE_PATH: process.env.SQLITE_PATH,
    DASHBOARD_JWT_SECRET: process.env.DASHBOARD_JWT_SECRET,
    DASHBOARD_API_KEY: process.env.DASHBOARD_API_KEY,
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
    AGENT_TICK_CRON: process.env.AGENT_TICK_CRON,
    SNAPSHOT_CRON: process.env.SNAPSHOT_CRON
  });

  cachedEnv = {
    ...parsed,
    allowedDomains: parsed.ALLOWED_DOMAINS.split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  };

  return cachedEnv;
}
