export class JobHeuristics {
    /**
     * H1: Heuristics to determine if a job requires a background subagent (long job)
     * vs being handled synchronously by the main orchestrator graph.
     * 
     * In MVP:
     * - Replying to simple questions (e.g., "What is the sprint goal?") is fast/sync.
     * - Building a feature, QAing a release, or framing a large spec is async.
     */
    static isLongJob(intentType: "query" | "build_feature" | "qa_release" | "unknown"): boolean {
        const longJobIntents = ["build_feature", "qa_release"];
        return longJobIntents.includes(intentType);
    }
}
