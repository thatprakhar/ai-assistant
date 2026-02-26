import { Scheduler } from "../scheduler/queue";

export interface SubagentOptions {
    runId: string;
    parentJobId?: string;
    role: string;
}

export class SubagentTemplate {
    /**
     * H3: Subagent templates
     * Factory pattern for spawning scoped subagents for isolated tasks.
     * Prevents the main master graph from bloating.
     */
    static async spawnReviewAgent(opts: SubagentOptions, codeRef: string) {
        return Scheduler.enqueueJob({
            runId: opts.runId,
            agentRole: "eng_review",
            taskType: "Code Review",
            payload: { codeRef }
        });
    }

    static async spawnResearchAgent(opts: SubagentOptions, topic: string) {
        return Scheduler.enqueueJob({
            runId: opts.runId,
            agentRole: "pm_research",
            taskType: "Market Research",
            payload: { topic }
        });
    }
}
