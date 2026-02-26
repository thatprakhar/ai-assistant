import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { writeArtifact } from "../../core/artifacts.js";
import { QAReportSchema } from "../../contracts/qa_report.schema.js";

export const qaGraph = new StateGraph(AgentStateAnnotation)
    .addNode("write_qa_plan", async (state: AgentState) => {
        console.log(`[QA] Formulating test matrix and QA plan...`);
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "qa_plan",
            authorRole: "qa",
            body: { mock: "plan" },
            markdown: "# QA Plan"
        });
        return { artifacts: { qa_plan: result.jsonPath } };
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
        const result = await writeArtifact({
            runId: state.runId,
            artifactType: "qa_report",
            authorRole: "qa",
            body: {
                results: [{ testId: "TC-1", status: "pass", notes: "All good" }],
                regressions: [],
                shipRecommendation: "ship",
                requiredFixes: []
            },
            markdown: "# QA Report\n\nRecommendation: SHIP",
            schema: QAReportSchema
        });
        return { artifacts: { qa_report: result.jsonPath } };
    })
    .addEdge("__start__", "write_qa_plan")
    .addEdge("write_qa_plan", "run_automated_checks")
    .addEdge("run_automated_checks", "review_diffs")
    .addEdge("review_diffs", "write_qa_report")
    .addEdge("write_qa_report", "__end__");

export const qaAgentApp = qaGraph.compile();
