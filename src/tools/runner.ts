import { Tool, ToolContext, ToolResult } from "./base";
import { PermissionManager } from "./permissions";
import pRetry from "p-retry";
import { ToolName } from "../contracts/common";

export class ToolRunner {
    /**
     * Executes a tool with permissions check, timeouts, and automatic retries.
     */
    static async run<TInput>(
        tool: Tool<TInput>,
        input: TInput,
        context: ToolContext,
        options: { retries?: number; timeoutMs?: number } = {}
    ): Promise<ToolResult> {
        const { retries = 2, timeoutMs = 30000 } = options;

        // 1. Check Permissions
        PermissionManager.checkPermission(context.role, tool.name);

        // 2. Validate Input
        const validInput = tool.inputSchema.parse(input);

        let attemptCount = 0;
        const startTime = Date.now();

        try {
            // 3. Execution with Retries + Timeout
            return await pRetry(
                async () => {
                    attemptCount++;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                    try {
                        const result = await tool.execute(validInput, context);

                        if (!result.ok) {
                            // If tool explicitly returned ok: false, decide if we should retry.
                            // For simplicity, we throw to trigger pRetry, and it will retry unless it's an AbortError.
                            throw new Error(result.error || "Tool execution failed");
                        }

                        return {
                            ...result,
                            meta: { durationMs: Date.now() - startTime, retries: attemptCount - 1 }
                        };
                    } catch (err: any) {
                        if (controller.signal.aborted) {
                            err.message = `Tool timeout after ${timeoutMs}ms`;
                        }
                        throw err;
                    } finally {
                        clearTimeout(timeoutId);
                    }
                },
                {
                    retries,
                    onFailedAttempt: (error: any) => {
                        console.warn(`[ToolRunner] ${tool.name} attempt ${attemptCount} failed: ${error.message}`);
                    },
                }
            );
        } catch (error: any) {
            // If all retries fail, return a structured error result instead of crashing the agent
            return {
                ok: false,
                error: `Tool ${tool.name} failed after ${attemptCount} attempts: ${error.message}`,
                meta: { durationMs: Date.now() - startTime, retries: attemptCount - 1 },
            };
        }
    }
}
