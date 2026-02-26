import { z } from "zod";
import { AgentRole, ToolName } from "../contracts/common";

export const ToolResultSchema = z.object({
    ok: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    meta: z.object({
        durationMs: z.number(),
        retries: z.number().default(0),
    }).optional(),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

export interface ToolContext {
    runId: string;
    role: AgentRole;
    stepId: string;
}

export interface Tool<TInput = any> {
    name: ToolName;
    description: string;
    inputSchema: z.ZodType<TInput>;
    execute(input: TInput, context: ToolContext): Promise<ToolResult>;
}
