import { RunManager } from "./db/runManager.js";
import { masterAgentApp } from "./agents/founder/master.js";
import { HumanMessage } from "@langchain/core/messages";
import { initDB } from "./db/schema.js";
import dotenv from "dotenv";

// 1. Load context
dotenv.config();

/**
 * Local simulation harness to run the orchestrator graph end-to-end
 * without relying on WhatsApp or Fastify ingress endpoints.
 */
async function simulate() {
    initDB();
    const threadKey = "simulated_chat_" + Date.now();
    const run = RunManager.createRun(threadKey);

    console.log(`\n=== Starting Simulation ===`);
    console.log(`[Simulation] Created Run: ${run.id}`);
    console.log(`[Simulation] Invoking Master Agent...\n`);

    const finalState = await masterAgentApp.invoke({
        runId: run.id,
        messages: [new HumanMessage("Determine whether we should shift the frontend from React to SolidJS")],
        currentRole: "founder",
        threadKey: threadKey
    });

    console.log("\n=== Simulation Complete ===");
    console.log(`[Simulation] Final Response Text: ${finalState.finalResponseText || "N/A"}`);
    console.log(`[Simulation] Tools Used Summary: ${finalState.toolsUsed || "None"}`);
    console.log(`[Simulation] Artifact paths: runs/${run.id}/artifacts/`);
}

simulate().catch(err => {
    console.error("Simulation crashed:", err);
    process.exit(1);
});
