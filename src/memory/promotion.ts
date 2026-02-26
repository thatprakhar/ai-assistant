import fs from "fs/promises";
import path from "path";
import { MemoryLayout, MemoryScope } from "./layout";

export class PromotionWorkflow {
    /**
     * Promotes a decision from a run's memory to the global company memory.
     * Only the founder role (by workflow design) should trigger this.
     * 
     * @param sourceRunId The ID of the run where the decision was made
     * @param sourcePath The relative path of the decision artifact in the run's artifacts
     * @param targetDecisionFilename The filename to save it as in company-memory/decisions/ (e.g., "00xx-use-postgres.md")
     */
    static async promoteDecision(
        sourceRunId: string,
        sourcePath: string,
        targetDecisionFilename: string
    ): Promise<void> {
        const runScope: MemoryScope = { type: "run", runId: sourceRunId };
        const globalScope: MemoryScope = { type: "global" };

        const sourceFullPath = MemoryLayout.resolvePath(runScope, sourcePath);
        const targetRelativePath = path.join("decisions", targetDecisionFilename);
        const targetFullPath = MemoryLayout.resolvePath(globalScope, targetRelativePath);

        try {
            const content = await fs.readFile(sourceFullPath, "utf-8");

            // Ensure target directory exists
            await fs.mkdir(path.dirname(targetFullPath), { recursive: true });

            // Write to global memory, bypassing standard Memory.write restrictions intentionally
            await fs.writeFile(targetFullPath, content, "utf-8");

        } catch (error: any) {
            throw new Error(`Failed to promote decision from ${sourceRunId}/${sourcePath}: ${error.message}`);
        }
    }

    /**
     * Updates an existing global architecture or roadmap file directly.
     * Use sparingly, primarily when a run fundamentally changes system invariants.
     */
    static async updateGlobalDoc(
        filename: "architecture.md" | "roadmap.md" | "vision.md",
        content: string
    ): Promise<void> {
        const globalScope: MemoryScope = { type: "global" };
        const targetFullPath = MemoryLayout.resolvePath(globalScope, filename);

        try {
            // Ensure target directory exists (though global root should always exist)
            await fs.mkdir(path.dirname(targetFullPath), { recursive: true });

            await fs.writeFile(targetFullPath, content, "utf-8");
        } catch (error: any) {
            throw new Error(`Failed to update global doc ${filename}: ${error.message}`);
        }
    }
}
