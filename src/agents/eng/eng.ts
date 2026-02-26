import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { writeArtifact } from "../../core/artifacts.js";
import { ImplementationSchema } from "../../contracts/implementation.schema.js";
import { ToolRunner } from "../../tools/runner.js";
import { BashTool } from "../../tools/bash.js";

export const engGraph = new StateGraph(AgentStateAnnotation)
    .addNode("tech_approach", async (state: AgentState) => {
        console.log(`[Eng] Planning tech approach...`);
        return {};
    })
    .addNode("task_breakdown", async (state: AgentState) => {
        console.log(`[Eng] Breaking down implementation tasks...`);
        return {};
    })
    .addNode("execute_changes", async (state: AgentState) => {
        console.log(`[Eng] Executing changes via Tools layer...`);

        const bashTool = new BashTool();

        const result = await ToolRunner.run(
            bashTool,
            { command: "echo 'Verifying environment...'" },
            { role: "eng", runId: state.runId, stepId: "t-1" }
        );

        const failedResult = await ToolRunner.run(
            bashTool,
            { command: "exit 1" },
            { role: "eng", runId: state.runId, stepId: "t-2" }
        );

        const toolsUsed = [...(state.toolsUsed || []), bashTool.name];
        const errors = [...(state.errors || [])];

        if (!failedResult.ok) {
            errors.push(`Tool warning: ${failedResult.error}`);
        }

        return {
            toolsUsed,
            errors
        };
    })
    .addNode("tests_verification", async (state: AgentState) => {
        console.log(`[Eng] Verifying functionality locally...`);
        return {};
    })
    .addNode("write_implementation", async (state: AgentState) => {
        console.log(`[Eng] Publishing Implementation artifact...`);
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "implementation",
            authorRole: "eng",
            body: {
                changedAreas: [{ path: "src/", reason: "implemented feature" }],
                commandsToRun: [{ cmd: "npm test", expected: "pass" }],
                featureFlags: [],
                knownLimitations: [],
                testingNotes: [],
                mapsToRequirements: [{ requirementId: "FR-1", evidence: "Code written" }]
            },
            markdown: "# Implementation\n\nChanges applied.",
            schema: ImplementationSchema
        });
        return { artifacts: { implementation: result.jsonPath } };
    })
    .addEdge("__start__", "tech_approach")
    .addEdge("tech_approach", "task_breakdown")
    .addEdge("task_breakdown", "execute_changes")
    .addEdge("execute_changes", "tests_verification")
    .addEdge("tests_verification", "write_implementation")
    .addEdge("write_implementation", "__end__");

export const engAgentApp = engGraph.compile();
