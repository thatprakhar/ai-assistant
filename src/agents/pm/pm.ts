import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { AIMessage } from "@langchain/core/messages";
import { writeArtifact } from "../../core/artifacts.js";
import { SpecSchema } from "../../contracts/spec.schema.js";
import { BuildPlanSchema } from "../../contracts/build_plan.schema.js";

export const pmGraph = new StateGraph(AgentStateAnnotation)
    .addNode("load_inputs", async (state: AgentState) => {
        console.log(`[PM] Loading context...`);
        return {};
    })
    .addNode("problem_framing", async (state: AgentState) => {
        console.log(`[PM] Framing problem and requirements...`);
        return {};
    })
    .addNode("write_spec", async (state: AgentState) => {
        console.log(`[PM] Writing Spec...`);
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "spec",
            authorRole: "pm",
            body: {
                problemStatement: "The user needs a new feature.",
                targetUser: "founder",
                userJourney: ["Trigger intent", "Execute flow"],
                functionalRequirements: [{ id: "FR-1", text: "Implement core function", priority: "must" }],
                nonFunctionalRequirements: [],
                outOfScope: ["External integrations"],
                openQuestions: [],
                acceptanceCriteria: [{ id: "AC-1", text: "It works" }],
                milestones: [{ id: "M1", name: "MVP", definitionOfDone: ["Shipped"] }]
            },
            markdown: "# Product Spec\n\nProblem: We need a new feature.",
            schema: SpecSchema
        });
        return { artifacts: { spec: result.jsonPath } };
    })
    .addNode("write_build_plan", async (state: AgentState) => {
        console.log(`[PM] Writing Build Plan...`);
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "build_plan",
            authorRole: "pm",
            body: {
                implementationMilestones: [{
                    milestoneId: "M1",
                    scope: ["FR-1"],
                    priority: "P0",
                    releaseCriteria: ["AC-1"]
                }],
                riskList: []
            },
            markdown: "# Build Plan\n\n1. M1: MVP",
            schema: BuildPlanSchema
        });
        return { artifacts: { build_plan: result.jsonPath } };
    })
    .addEdge("__start__", "load_inputs")
    .addEdge("load_inputs", "problem_framing")
    .addEdge("problem_framing", "write_spec")
    .addEdge("write_spec", "write_build_plan")
    .addEdge("write_build_plan", "__end__");

export const pmAgentApp = pmGraph.compile();
