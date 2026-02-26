import { Memory } from "./memory";
import { MemoryScope } from "./layout";
import { AgentRole } from "../contracts/common";

export interface ContextPack {
    globalContext: {
        vision: string;
        roadmap: string;
        architecture: string;
        recentDecisions: string[];
    };
    runContext: {
        artifacts: string[]; // paths to existing artifacts in the run
    };
    scratch: string; // The agent's specific scratch notes for this run
}

export class ContextRetriever {
    /**
     * Retrieves the default context pack for a specific role and run.
     * As per C4 requirements: "default context pack per role (pointers + summaries, not whole docs)"
     */
    static async getContextPack(role: AgentRole, runId: string): Promise<ContextPack> {
        const globalScope: MemoryScope = { type: "global" };
        const runScope: MemoryScope = { type: "run", runId };
        const scratchScope: MemoryScope = { type: "scratch", runId, role };

        // 1. Fetch Global Top-Level Summaries (we assume these files exist or return empty)
        const vision = await Memory.read(globalScope, "vision.md");
        const roadmap = await Memory.read(globalScope, "roadmap.md");
        const architecture = await Memory.read(globalScope, "architecture.md");

        // Fetch list of decisions (pointers, not content to save tokens)
        const decisionsList = await Memory.list(globalScope, "decisions");

        // 2. Fetch Run Artifact Pointers
        // The master agent / orchestrator builds the actual artifacts. 
        // We just supply paths so the agent knows what exists in the working memory.
        const runArtifacts = await Memory.list(runScope, "");

        // 3. Fetch specific agent scratchpad
        const scratchNote = await Memory.read(scratchScope, "notes.md");

        return {
            globalContext: {
                vision: this.truncateOrSummarize(vision, 1000), // simplistic limit for now
                roadmap: this.truncateOrSummarize(roadmap, 1000),
                architecture: this.truncateOrSummarize(architecture, 1500),
                recentDecisions: decisionsList.slice(-5), // Just top 5 most recent by name
            },
            runContext: {
                artifacts: runArtifacts,
            },
            scratch: scratchNote,
        };
    }

    /**
     * Helper to keep the default context pack lightweight.
     * In a real system, you might use an LLM or vector DB to summarize.
     */
    private static truncateOrSummarize(content: string, maxLen: number): string {
        if (!content) return "";
        if (content.length <= maxLen) return content;
        return content.substring(0, maxLen) + "\n... [truncated] ...";
    }
}
