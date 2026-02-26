import fs from "fs/promises";
import path from "path";
import { MemoryLayout, MemoryScope } from "./layout";

export class Memory {
    /**
     * Reads a file from memory within the allowed scope.
     */
    static async read(scope: MemoryScope, relativePath: string): Promise<string> {
        const fullPath = MemoryLayout.resolvePath(scope, relativePath);
        try {
            return await fs.readFile(fullPath, "utf-8");
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return ""; // Consistent with reading empty memory if not found
            }
            throw new Error(`Failed to read memory at ${fullPath}: ${error.message}`);
        }
    }

    /**
     * Writes to a file in memory within the allowed scope.
     * Checks permissions: Roles cannot write to global memory directly via this method unless explicitly allowed.
     */
    static async write(scope: MemoryScope, relativePath: string, content: string): Promise<void> {
        this.checkWritePermission(scope);
        const fullPath = MemoryLayout.resolvePath(scope, relativePath);

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");
    }

    /**
     * Appends to a file in memory within the allowed scope.
     */
    static async append(scope: MemoryScope, relativePath: string, content: string): Promise<void> {
        this.checkWritePermission(scope);
        const fullPath = MemoryLayout.resolvePath(scope, relativePath);

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.appendFile(fullPath, content, "utf-8");
    }

    /**
     * Lists files in a memory directory.
     */
    static async list(scope: MemoryScope, relativeDir: string = ""): Promise<string[]> {
        const fullPath = MemoryLayout.resolvePath(scope, relativeDir);
        try {
            return await fs.readdir(fullPath);
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw new Error(`Failed to list memory directory at ${fullPath}: ${error.message}`);
        }
    }

    private static checkWritePermission(scope: MemoryScope) {
        // As per C3/C4 requirements in Milestones:
        // "Roles cannot write global memory directly; founder can promote decisions"
        // For general memory tools used by agents, global is read-only. We require a special promotion workflow.
        if (scope.type === "global") {
            throw new Error("Direct writes to global memory are prohibited. Use the promotion workflow.");
        }
    }
}
