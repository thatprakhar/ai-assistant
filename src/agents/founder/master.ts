import { StateGraph } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentState } from "../state.js";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ContextRetriever } from "../../memory/retrieval.js";
import { JobHeuristics } from "../../scheduler/heuristics.js";
import { Scheduler } from "../../scheduler/queue.js";
import { CheckpointWriter } from "../../db/checkpoint.js";
import { RunManager } from "../../db/runManager.js";
import { pmAgentApp } from "../pm/pm.js";
import { designAgentApp } from "../design/design.js";
import { engAgentApp } from "../eng/eng.js";
import { qaAgentApp } from "../qa/qa.js";
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
        const step = RunManager.appendStep(state.runId, "scheduler_enqueue");
        RunManager.updateStepStatus(step.id, "running");

        await Scheduler.enqueueJob({
            runId: state.runId,
            chatId: state.threadKey,
            initialMessageId: state.initialMessageId || "unknown", // Fallback correlate ID
            taskType: "Long-running Feature/Analysis",
            agentRole: "founder",
            payload: state
        });

        RunManager.updateStepStatus(step.id, "success");
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, state);

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
        RunManager.updateStepStatus(step.id, "running");

        const pmOut = await pmAgentApp.invoke({ ...state, currentRole: "pm" });

        RunManager.updateStepStatus(step.id, "success");
        const mergedState = { ...state, ...pmOut };
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, mergedState);

        return {
            artifacts: pmOut.artifacts || {},
            errors: pmOut.errors || [],
            toolsUsed: pmOut.toolsUsed || []
        };
    })

    // 3. Conditional route based on requiresDesign (Mocked logic)
    .addNode("delegate_design", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Design`);
        const step = RunManager.appendStep(state.runId, "design_graph");
        RunManager.updateStepStatus(step.id, "running");

        const designOut = await designAgentApp.invoke({ ...state, currentRole: "design" });

        RunManager.updateStepStatus(step.id, "success");
        const mergedState = { ...state, ...designOut };
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, mergedState);

        return {
            artifacts: designOut.artifacts || {},
            errors: designOut.errors || [],
            toolsUsed: designOut.toolsUsed || []
        };
    })

    // 4. Delegate to Eng
    .addNode("delegate_eng", async (state: AgentState) => {
        console.log(`[Founder] Delegating to Eng`);
        const step = RunManager.appendStep(state.runId, "eng_graph");
        RunManager.updateStepStatus(step.id, "running");

        const engOut = await engAgentApp.invoke({ ...state, currentRole: "eng" });

        RunManager.updateStepStatus(step.id, "success");
        const mergedState = { ...state, ...engOut };
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, mergedState);

        return {
            artifacts: engOut.artifacts || {},
            errors: engOut.errors || [],
            toolsUsed: engOut.toolsUsed || []
        };
    })

    // 5. Delegate to QA
    .addNode("delegate_qa", async (state: AgentState) => {
        console.log(`[Founder] Delegating to QA`);
        const step = RunManager.appendStep(state.runId, "qa_graph");
        RunManager.updateStepStatus(step.id, "running");

        const qaOut = await qaAgentApp.invoke({ ...state, currentRole: "qa" });

        RunManager.updateStepStatus(step.id, "success");
        const mergedState = { ...state, ...qaOut };
        await CheckpointWriter.saveCheckpoint(state.runId, step.id, mergedState);

        return {
            artifacts: qaOut.artifacts || {},
            errors: qaOut.errors || [],
            toolsUsed: qaOut.toolsUsed || []
        };
    })

    // 6. Merge & Respond
    .addNode("respond", async (state: AgentState) => {
        console.log(`[Founder] Creating final response for TRIVIAL completion`);
        const builtArtifacts = Object.keys(state.artifacts || {}).join(", ");
        return {
            finalResponseText: `Processed request ${state.jobClass || "TRIVIAL"}. Generated artifacts: ${builtArtifacts}`
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
