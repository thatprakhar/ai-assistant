import { describe, it, expect } from "vitest";
import { JobHeuristics } from "../src/scheduler/heuristics.js";

describe("JobHeuristics", () => {
    it("should classify short simple messages as TRIVIAL", () => {
        const result = JobHeuristics.classifyJob("Hello, how are you?");
        expect(result.jobClass).toBe("TRIVIAL");
        expect(result.score).toBeLessThan(0.5);
    });

    it("should classify messages with 'build' as LONG_JOB", () => {
        const result = JobHeuristics.classifyJob("Can you build a new dashboard for me?");
        expect(result.jobClass).toBe("LONG_JOB");
        expect(result.score).toBeGreaterThan(0.5);
    });
});
