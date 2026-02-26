import { z } from "zod";
import { Tool, ToolContext, ToolResult } from "./base";
import { execa } from "execa";

const MAX_OUTPUT_LENGTH = 10000;

export const BashToolInputSchema = z.object({
    command: z.string().min(1, "Command cannot be empty"),
    cwd: z.string().optional(),
});

export type BashToolInput = z.infer<typeof BashToolInputSchema>;

export class BashTool implements Tool<BashToolInput> {
    name = "bash" as const;
    description = "Executes arbitrary terminal commands in the specified directory. Note: State is not persisted between commands.";
    inputSchema = BashToolInputSchema;

    async execute(input: BashToolInput, context: ToolContext): Promise<ToolResult> {
        try {
            const { stdout, stderr, exitCode } = await execa(input.command, {
                cwd: input.cwd || process.cwd(),
                shell: true, // required for arbitrary bash strings
                all: true,   // merges stdout and stderr if we want
                reject: false // Do not throw on non-zero exit codes so we can return cleanly
            });

            // Prevent overloading the agent with gigabytes of output
            const output = this.truncate(stdout || "", MAX_OUTPUT_LENGTH);
            const errorOutput = this.truncate(stderr || "", MAX_OUTPUT_LENGTH);

            if (exitCode !== 0) {
                return {
                    ok: false,
                    error: `Command failed with exit code ${exitCode}:\n${errorOutput}\n${output}`,
                };
            }

            return {
                ok: true,
                data: {
                    stdout: output,
                    stderr: errorOutput,
                    exitCode
                }
            };
        } catch (error: any) {
            return {
                ok: false,
                error: `Bash spawn error: ${error.message}`
            };
        }
    }

    private truncate(str: string, maxLen: number): string {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + "\n... [TRUNCATED] ...";
    }
}
