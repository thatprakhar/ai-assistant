import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state";

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
        // Tools layer interactions happen here
        return {};
    })
    .addNode("tests_verification", async (state: AgentState) => {
        console.log(`[Eng] Verifying functionality locally...`);
        return {};
    })
    .addNode("write_implementation", async (state: AgentState) => {
        console.log(`[Eng] Publishing Implementation artifact...`);
        return {
            artifacts: { implementation: "runs/" + state.runId + "/artifacts/implementation.json" }
        };
    })
    .addEdge("__start__", "tech_approach")
    .addEdge("tech_approach", "task_breakdown")
    .addEdge("task_breakdown", "execute_changes")
    .addEdge("execute_changes", "tests_verification")
    .addEdge("tests_verification", "write_implementation")
    .addEdge("write_implementation", "__end__");

export const engAgentApp = engGraph.compile();
