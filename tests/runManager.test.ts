import { describe, it, expect } from "vitest";
import { RunManager } from "../src/db/runManager.js";
import { initDB } from "../src/db/schema.js";

describe("RunManager", () => {
    it("should create a run and append steps", () => {
        initDB();
        const threadKey = "test-thread-" + Date.now();
        const run = RunManager.createRun(threadKey);

        expect(run.id).toBeDefined();
        expect(run.state).toBe("active");

        const step = RunManager.appendStep(run.id, "test_tool");
        expect(step.status).toBe("pending");

        RunManager.updateStepStatus(step.id, "success");
        const steps = RunManager.getStepsForRun(run.id);
        expect(steps.length).toBe(1);
        expect(steps[0].status).toBe("success");
    });
});
