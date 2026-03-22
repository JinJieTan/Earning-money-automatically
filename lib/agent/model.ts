import OpenAI from "openai";
import { getEnv } from "@/lib/env";

let client: OpenAI | null = null;

function getClient() {
  if (client) return client;
  const env = getEnv();
  client = new OpenAI({
    apiKey: env.LLM_API_KEY,
    baseURL: env.LLM_BASE_URL
  });
  return client;
}

export async function askModel(input: {
  system: string;
  prompt: string;
  maxTokens?: number;
}) {
  const env = getEnv();

  const completion = await getClient().chat.completions.create({
    model: env.LLM_MODEL_NAME,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt }
    ],
    temperature: 0.2,
    max_tokens: input.maxTokens ?? 600
  });

  return completion.choices[0]?.message?.content ?? "";
}
