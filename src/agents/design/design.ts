import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state";

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
        return {
            artifacts: { design: "runs/" + state.runId + "/artifacts/design.json" }
        };
    })
    .addEdge("__start__", "ux_goals")
    .addEdge("ux_goals", "copy_and_interaction")
    .addEdge("copy_and_interaction", "write_design")
    .addEdge("write_design", "__end__");

export const designAgentApp = designGraph.compile();
