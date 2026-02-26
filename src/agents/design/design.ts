import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { writeArtifact } from "../../core/artifacts.js";
import { DesignSchema } from "../../contracts/design.schema.js";

export const designGraph = new StateGraph(AgentStateAnnotation)
    .addNode("ux_goals", async (state: AgentState) => {
        console.log(`[Design] Defining UX goals and flows...`);
        return {};
    })
    .addNode("copy_and_interaction", async (state: AgentState) => {
        console.log(`[Design] Defining copy and interaction rules...`);
        return {};
    })
    .addNode("write_design", async (state: AgentState) => {
        console.log(`[Design] Publishing Design document...`);
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "design",
            authorRole: "design",
            body: {
                uxGoals: ["Simple interaction"],
                informationArchitecture: [],
                flows: [{ id: "FLOW-1", name: "Main Flow", steps: ["Start", "End"], edgeCases: [] }],
                copy: [{ key: "hello", text: "Hello", toneNotes: "" }],
                interactionRules: [],
                states: [{ surface: "whatsapp", state: "success", behavior: "send message" }],
                designDecisions: [],
                handoffNotesForEng: []
            },
            markdown: "# Design Document\n\nFlows mapped.",
            schema: DesignSchema
        });
        return { artifacts: { design: result.jsonPath } };
    })
    .addEdge("__start__", "ux_goals")
    .addEdge("ux_goals", "copy_and_interaction")
    .addEdge("copy_and_interaction", "write_design")
    .addEdge("write_design", "__end__");

export const designAgentApp = designGraph.compile();
