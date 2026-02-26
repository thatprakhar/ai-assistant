import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ContextRetriever } from "../../memory/retrieval";

import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
});

// Invoke the real LLM (requires ANTHROPIC_API_KEY env variable)
async function invokeModel(messages: BaseMessage[], systemPrompt: string): Promise<AIMessage> {
    const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        ...messages
    ]);
    return response as AIMessage;
}

export const founderGraph = new StateGraph(AgentStateAnnotation)
    // 1. Ingest Message & Load Context
    .addNode("ingest", async (state: AgentState) => {
        console.log(`[Founder] Ingesting message for run ${state.runId}`);
        const context = await ContextRetriever.getContextPack("founder", state.runId);

        // For MVP: simply save the context as an artifact pointer
        return {
            artifacts: { context: "runs/" + state.runId + "/artifacts/context.json" }
        };
    })

    // 2. Delegate to PM
    .addNode("delegate_pm", async (state: AgentState) => {
        console.log(`[Founder] Delegating to PM`);
        // Here we would effectively trigger the PM graph or node
        // For now, returning a simulated state update
        return {
            messages: [new AIMessage("PM Spec has been created")],
            artifacts: { spec: "runs/" + state.runId + "/artifacts/spec.json" }
        };
    })

    // 3. Conditional route based on requiresDesign (Mocked logic)
    .addNode("delegate_design", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Design`);
        return {
            artifacts: { design: "runs/" + state.runId + "/artifacts/design.json" }
        };
    })

    // 4. Delegate to Eng
    .addNode("delegate_eng", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Eng`);
        return {
            artifacts: { implementation: "runs/" + state.runId + "/artifacts/implementation.json" }
        };
    })

    // 5. Delegate to QA
    .addNode("delegate_qa", async (state: AgentState) => {
        console.log(`[Founder] Delegating to QA`);
        return {
            artifacts: { qa_report: "runs/" + state.runId + "/artifacts/qa_report.json" }
        };
    })

    // 6. Merge & Respond
    .addNode("respond", async (state: AgentState) => {
        console.log(`[Founder] Creating final response`);
        return {
            messages: [new AIMessage("We have successfully completed the feature.")]
        };
    })

    // Edges
    .addEdge("__start__", "ingest")
    .addEdge("ingest", "delegate_pm")
    .addEdge("delegate_pm", "delegate_design") // Mock: assume design is needed
    .addEdge("delegate_design", "delegate_eng")
    .addEdge("delegate_eng", "delegate_qa")
    .addEdge("delegate_qa", "respond")
    .addEdge("respond", "__end__");

export const masterAgentApp = founderGraph.compile();
