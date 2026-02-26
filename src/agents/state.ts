import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { AgentRole } from "../contracts/common";

/**
 * The unified State for all agent graphs.
 * In a more complex setup, each agent might have its own State specific to its graph,
 * but for the AI Company, they all share a common baseline state which gets appended to.
 */
export const AgentStateAnnotation = Annotation.Root({
    // The history of messages in the current execution
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    runId: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),

    currentRole: Annotation<AgentRole>({
        reducer: (x, y) => y ?? x,
        default: () => "founder",
    }),

    threadKey: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),

    finalResponseText: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),

    toolsUsed: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    jobClass: Annotation<"TRIVIAL" | "LONG_JOB" | undefined>({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),

    routeReasons: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    // Any errors encountered in the graph
    errors: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    // Pointers to artifacts created during the run
    artifacts: Annotation<Record<string, string>>({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),
});

export type AgentState = typeof AgentStateAnnotation.State;
