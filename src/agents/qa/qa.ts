import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state";

export const qaGraph = new StateGraph(AgentStateAnnotation)
    .addNode("write_qa_plan", async (state: AgentState) => {
        console.log(`[QA] Formulating test matrix and QA plan...`);
        return {
            artifacts: { qa_plan: "runs/" + state.runId + "/artifacts/qa_plan.json" }
        };
    })
    .addNode("run_automated_checks", async (state: AgentState) => {
        console.log(`[QA] Running automated verification...`);
        return {};
    })
    .addNode("review_diffs", async (state: AgentState) => {
        console.log(`[QA] Reviewing execution risks...`);
        return {};
    })
    .addNode("write_qa_report", async (state: AgentState) => {
        console.log(`[QA] Producing QA Report...`);
        return {
            artifacts: { qa_report: "runs/" + state.runId + "/artifacts/qa_report.json" }
        };
    })
    .addEdge("__start__", "write_qa_plan")
    .addEdge("write_qa_plan", "run_automated_checks")
    .addEdge("run_automated_checks", "review_diffs")
    .addEdge("review_diffs", "write_qa_report")
    .addEdge("write_qa_report", "__end__");

export const qaAgentApp = qaGraph.compile();
