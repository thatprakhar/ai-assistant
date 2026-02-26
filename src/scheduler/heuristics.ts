export class JobHeuristics {
    /**
     * Classifies whether a text message requires a long multi-agent
     * execution or can be handled trivially inline.
     */
    static classifyJob(text: string): { jobClass: "TRIVIAL" | "LONG_JOB"; score: number; reasons: string[] } {
        const lower = text.toLowerCase();

        // Heuristics bounds implementation
        if (
            lower.includes("build") ||
            lower.includes("design") ||
            lower.includes("feature") ||
            lower.includes("implement") ||
            lower.includes("generate") ||
            text.length > 200
        ) {
            return {
                jobClass: "LONG_JOB",
                score: 0.9,
                reasons: ["Triggered generative/planning keywords ('build', 'design', 'feature') or length > 200."]
            };
        }

        return {
            jobClass: "TRIVIAL",
            score: 0.2,
            reasons: ["Short message without building/generative trigger words."]
        };
    }
}
