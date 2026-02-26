import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state";
import { AIMessage } from "@langchain/core/messages";

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
        return {
            artifacts: { spec: "runs/" + state.runId + "/artifacts/spec.json" }
        };
    })
    .addNode("write_build_plan", async (state: AgentState) => {
        console.log(`[PM] Writing Build Plan...`);
        return {
            artifacts: { build_plan: "runs/" + state.runId + "/artifacts/build_plan.json" }
        };
    })
    .addEdge("__start__", "load_inputs")
    .addEdge("load_inputs", "problem_framing")
    .addEdge("problem_framing", "write_spec")
    .addEdge("write_spec", "write_build_plan")
    .addEdge("write_build_plan", "__end__");

export const pmAgentApp = pmGraph.compile();
