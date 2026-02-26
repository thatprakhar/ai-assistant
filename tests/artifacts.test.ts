import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeArtifact, readArtifact } from "../src/core/artifacts.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const TestSchema = z.object({ foo: z.string() });
const TEST_ROOT = path.join(process.cwd(), "tests_tmp_artifacts");

describe("Artifacts File System", () => {
    beforeAll(async () => {
        await fs.mkdir(TEST_ROOT, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(TEST_ROOT, { recursive: true, force: true });
    });

    it("should roundtrip write and read successfully with schema", async () => {
        const runId = "test-run-1";
        const { jsonPath, mdPath } = await writeArtifact({
            runId,
            artifactType: "test_art",
            authorRole: "pm",
            body: { foo: "bar" },
            markdown: "# Test\n\nFoo is bar",
            schema: TestSchema,
            runsRootDir: TEST_ROOT
        });

        expect(jsonPath).toContain("test_art.json");
        expect(mdPath).toContain("test_art.md");

        const read = await readArtifact<{ foo: string }>(runId, "test_art", TEST_ROOT);
        expect(read.json.body.foo).toBe("bar");
        expect(read.markdown.body).toContain("Foo is bar");
        expect(read.json.header.authorRole).toBe("pm");
    });
});
