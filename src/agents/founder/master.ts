import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ContextRetriever } from "../../memory/retrieval.js";
import { JobHeuristics } from "../../scheduler/heuristics.js";
import { Scheduler } from "../../scheduler/queue.js";
import { CheckpointWriter } from "../../db/checkpoint.js";
import { RunManager } from "../../db/runManager.js";
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "mock-key",
});

async function invokeModel(messages: BaseMessage[], systemPrompt: string): Promise<AIMessage> {
    const response = await llm.invoke([
        { role: "system", content: systemPrompt },
        ...messages
    ]);
    return response as AIMessage;
}

export const founderGraph = new StateGraph(AgentStateAnnotation)
    // 0. Analyze Request
    .addNode("analyze_request", async (state: AgentState) => {
        console.log(`[Founder] Analyzing request for run ${state.runId}`);
        const lastMsg = state.messages[state.messages.length - 1];
        const text = lastMsg?.content?.toString() || "";
        const analysis = JobHeuristics.classifyJob(text);

        return {
            jobClass: analysis.jobClass,
            routeReasons: analysis.reasons
        };
    })

    // 0b. Dispatch Background Job
    .addNode("dispatch_long_job", async (state: AgentState) => {
        console.log(`[Founder] Dispatching background job for run ${state.runId}`);
        await Scheduler.enqueueJob({
            runId: state.runId,
            chatId: state.threadKey,
            initialMessageId: state.runId, // Fallback correlate ID
            taskType: "Long-running Feature/Analysis",
            agentRole: "founder",
            payload: state
        });

        return {
            finalResponseText: "I'm starting a background task to work on your request. I'll notify you when it's complete."
        };
    })

    // 1. Ingest Message & Load Context (TRIVIAL flow starts here)
    .addNode("ingest", async (state: AgentState) => {
        console.log(`[Founder] Ingesting message inline for run ${state.runId}`);
        const context = await ContextRetriever.getContextPack("founder", state.runId);
        return {
            artifacts: { context: "runs/" + state.runId + "/artifacts/context.json" }
        };
    })

    // 2. Delegate to PM
    .addNode("delegate_pm", async (state: AgentState) => {
        console.log(`[Founder] Delegating to PM`);
        const step = RunManager.appendStep(state.runId, "pm_graph");

        // Mock PM execution for now
        RunManager.updateStepStatus(step.id, "success");
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, state);

        return {
            artifacts: { spec: "runs/" + state.runId + "/artifacts/spec.json" }
        };
    })

    // 3. Conditional route based on requiresDesign (Mocked logic)
    .addNode("delegate_design", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Design`);
        const step = RunManager.appendStep(state.runId, "design_graph");

        // Mock Design execution for now
        RunManager.updateStepStatus(step.id, "success");
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, state);

        return {
            artifacts: { design: "runs/" + state.runId + "/artifacts/design.json" }
        };
    })

    // 4. Delegate to Eng
    .addNode("delegate_eng", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Eng`);
        const step = RunManager.appendStep(state.runId, "eng_graph");

        // Mock Eng execution for now
        RunManager.updateStepStatus(step.id, "success");
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, state);

        return {
            artifacts: { implementation: "runs/" + state.runId + "/artifacts/implementation.json" }
        };
    })

    // 5. Delegate to QA
    .addNode("delegate_qa", async (state: AgentState) => {
        console.log(`[Founder] Delegating to QA`);
        const step = RunManager.appendStep(state.runId, "qa_graph");

        // Mock QA execution for now
        RunManager.updateStepStatus(step.id, "success");
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, state);

        return {
            artifacts: { qa_report: "runs/" + state.runId + "/artifacts/qa_report.json" }
        };
    })

    // 6. Merge & Respond
    .addNode("respond", async (state: AgentState) => {
        console.log(`[Founder] Creating final response for TRIVIAL completion`);
        return {
            finalResponseText: "We have successfully processed your request inline."
        };
    })

    // Edges
    .addEdge("__start__", "analyze_request")
    .addConditionalEdges("analyze_request", (state: AgentState) => {
        return state.jobClass === "LONG_JOB" ? "dispatch_long_job" : "ingest";
    })
    .addEdge("dispatch_long_job", "__end__")
    .addEdge("ingest", "delegate_pm")
    .addEdge("delegate_pm", "delegate_design") // Mock: assume design is needed
    .addEdge("delegate_design", "delegate_eng")
    .addEdge("delegate_eng", "delegate_qa")
    .addEdge("delegate_qa", "respond")
    .addEdge("respond", "__end__");

export const masterAgentApp = founderGraph.compile();
