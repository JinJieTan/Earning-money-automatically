import { chromium } from "playwright";
import { assertAllowedUrl } from "@/lib/agent/guardrails";

export async function runUpworkTask(dryRun: boolean) {
  const url = "https://www.upwork.com";
  assertAllowedUrl(url);

  if (dryRun) {
    return {
      ok: true,
      note: "Dry-run: skipped proposal submission on Upwork."
    };
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    return {
      ok: true,
      note: `Visited ${url}; manual selectors not implemented in v1.`
    };
  } finally {
    await browser.close();
  }
}
