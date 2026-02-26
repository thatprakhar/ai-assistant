import { HumanMessage } from "@langchain/core/messages";
import { db } from "../db/schema";
import { RunManager } from "../db/runManager";
import { masterAgentApp } from "../agents/founder/master";

export interface WhatsAppMessageEvent {
    messageId: string;
    chatId: string;
    text: string;
    timestamp: string;
    senderName?: string;
    metadata?: any;
}

export class IngressGateway {
    /**
     * Handles an incoming message from the local webhook.
     * Ensures idempotency key (chatId, messageId), creates a run, and hands off to Master Agent.
     */
    static async handleIncomingMessage(event: WhatsAppMessageEvent): Promise<void> {
        // 1. Idempotency Check
        const existingEvent = db.prepare(`SELECT * FROM inbound_events WHERE message_id = ? AND chat_id = ?`).get(event.messageId, event.chatId);

        if (existingEvent) {
            console.log(`[Ingress] Ignoring duplicate message: ${event.messageId} from ${event.chatId}`);
            return;
        }

        // We assume single-user MVP, so thread_key can just be the user's chat ID for continuity
        const threadKey = event.chatId;

        // 2. Create Run
        const run = RunManager.createRun(threadKey);

        // 3. Write inbound event to DB with link to Run
        db.prepare(`
            INSERT INTO inbound_events (id, message_id, chat_id, status, run_id)
            VALUES (?, ?, ?, 'pending', ?)
        `).run(event.messageId, event.messageId, event.chatId, run.id); // using msgId as basic PK for now

        console.log(`[Ingress] Created Run ${run.id} for message ${event.messageId}`);

        // 4. Hand off to Master Agent orchestrator (Fire and Forget)
        // In reality you may want to push to a job queue (like BullMQ/P-Queue) here
        this.triggerAgent(run.id, event).catch((err) => {
            console.error(`[Ingress] Agent triggered error for run ${run.id}:`, err);
            db.prepare(`UPDATE inbound_events SET status = 'failed' WHERE message_id = ?`).run(event.messageId);
            RunManager.updateRunState(run.id, "failed");
        });
    }

    private static async triggerAgent(runId: string, event: WhatsAppMessageEvent): Promise<void> {
        RunManager.updateRunState(runId, "active");

        db.prepare(`UPDATE inbound_events SET status = 'processed' WHERE message_id = ?`).run(event.messageId);

        // Kick off the LangGraph App
        const finalState = await masterAgentApp.invoke({
            runId: runId,
            messages: [new HumanMessage(event.text)],
        });

        console.log(`[Ingress] Master Agent finished run ${runId}.`);
        RunManager.updateRunState(runId, "completed");

        // Assuming orchestrator pushes outgoing messages via Egress Gateway internally
        // or we can take finalState.messages and send them here.
    }
}
