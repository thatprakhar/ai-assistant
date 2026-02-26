import { z } from "zod";
import { Tool, ToolContext, ToolResult } from "./base";
import { chromium } from "playwright";

export const BrowserToolInputSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    action: z.enum(["scrape", "screenshot"]),
});

export type BrowserToolInput = z.infer<typeof BrowserToolInputSchema>;

export class BrowserTool implements Tool<BrowserToolInput> {
    name = "browser" as const;
    description = "Navigates to a webpage and either scrapes its text content or takes a screenshot.";
    inputSchema = BrowserToolInputSchema;

    async execute(input: BrowserToolInput, context: ToolContext): Promise<ToolResult> {
        try {
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 15000 });

            if (input.action === "scrape") {
                // Remove scripts and styles, extract visible text
                const textContent = await page.evaluate(() => {
                    document.querySelectorAll('script, style').forEach(el => el.remove());
                    return document.body.innerText;
                });

                await browser.close();
                return {
                    ok: true,
                    data: {
                        url: input.url,
                        content: this.truncate(textContent, 20000)
                    }
                };
            } else if (input.action === "screenshot") {
                // In a real system you'd save this to `runs/<runId>/artifacts/`
                const buffer = await page.screenshot({ type: "jpeg", quality: 60 });
                await browser.close();

                // For simplicity, just returning the buffer size or base64 indicator
                return {
                    ok: true,
                    data: {
                        url: input.url,
                        screenshotSize: buffer.length,
                        message: "Screenshot data obtained"
                    }
                };
            }

            await browser.close();
            return { ok: false, error: "Invalid action" };

        } catch (error: any) {
            return { ok: false, error: `Browser operation failed: ${error.message}` };
        }
    }

    private truncate(str: string, maxLen: number): string {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + "\n... [TRUNCATED] ...";
    }
}
