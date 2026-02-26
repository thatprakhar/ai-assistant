import { z } from "zod";
import { Tool, ToolContext, ToolResult } from "./base";
import fs from "fs/promises";
import path from "path";

export const FileToolInputSchema = z.discriminatedUnion("operation", [
    z.object({
        operation: z.literal("read"),
        path: z.string().min(1),
    }),
    z.object({
        operation: z.literal("write"),
        path: z.string().min(1),
        content: z.string(),
    }),
    z.object({
        operation: z.literal("patch"),
        path: z.string().min(1),
        find: z.string(),
        replace: z.string(),
    }),
]);

export type FileToolInput = z.infer<typeof FileToolInputSchema>;

export class FileTool implements Tool<FileToolInput> {
    name = "files" as const;
    description = "Read, write, or patch files on the disk.";
    inputSchema = FileToolInputSchema;

    async execute(input: FileToolInput, context: ToolContext): Promise<ToolResult> {
        const fullPath = path.resolve(process.cwd(), input.path);

        try {
            switch (input.operation) {
                case "read":
                    const content = await fs.readFile(fullPath, "utf-8");
                    return { ok: true, data: { content } };

                case "write":
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    await fs.writeFile(fullPath, input.content, "utf-8");
                    return { ok: true, data: { message: `File written at ${fullPath}` } };

                case "patch":
                    const existing = await fs.readFile(fullPath, "utf-8");
                    if (!existing.includes(input.find)) {
                        return { ok: false, error: `Patch failed: 'find' block not found in exactly as provided.` };
                    }
                    const updated = existing.replace(input.find, input.replace);
                    await fs.writeFile(fullPath, updated, "utf-8");
                    return { ok: true, data: { message: `File patched at ${fullPath}` } };

                default:
                    return { ok: false, error: "Invalid operation type" };
            }
        } catch (error: any) {
            return { ok: false, error: `File operation failed: ${error.message}` };
        }
    }
}
