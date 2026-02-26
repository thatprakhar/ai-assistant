import path from "path";
import { AgentRole } from "../contracts/common";

export const PROJECT_ROOT = process.cwd(); // Assume we run from project root

export type MemoryScope =
    | { type: "global" }
    | { type: "run"; runId: string }
    | { type: "scratch"; runId: string; role: AgentRole };

export class MemoryLayout {
    /**
     * Resolves the absolute path for a given scope and relative path.
     * Ensures the resolved path stays within the intended scope boundary (prevents path traversal).
     */
    static resolvePath(scope: MemoryScope, relativePath: string): string {
        const basePath = this.getBasePath(scope);
        const resolvedPath = path.resolve(basePath, relativePath);

        // Security check: ensure path traversal didn't escape the base directory
        if (!resolvedPath.startsWith(basePath)) {
            throw new Error(`Path traversal violation: Cannot access outside of scope base path`);
        }

        return resolvedPath;
    }

    /**
     * Gets the base directory for a given memory scope.
     */
    static getBasePath(scope: MemoryScope): string {
        switch (scope.type) {
            case "global":
                return path.join(PROJECT_ROOT, "company-memory");
            case "run":
                // matches: runs/<runId>/artifacts/
                return path.join(PROJECT_ROOT, "runs", scope.runId, "artifacts");
            case "scratch":
                // matches: runs/<runId>/scratch/<role>/
                return path.join(PROJECT_ROOT, "runs", scope.runId, "scratch", scope.role);
            default:
                throw new Error("Invalid memory scope");
        }
    }
}
