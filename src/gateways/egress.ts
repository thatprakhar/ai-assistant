import { db } from "../db/schema";
import { v4 as uuidv4 } from "uuid";
import { fetch } from "undici";

// Setup
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "test-access-token";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "test-phone-id";

export class EgressGateway {
    /**
     * Sends a message via the WhatsApp API and logs it for deduplication.
     */
    static async sendMessage(runId: string, chatId: string, text: string): Promise<void> {
        const id = uuidv4();

        // 1. Write an outgoing record
        db.prepare(`
            INSERT INTO outbound_messages (id, run_id, chat_id, payload, status)
            VALUES (?, ?, ?, ?, 'queued')
        `).run(id, runId, chatId, JSON.stringify({ type: "text", text: { body: text } }));

        console.log(`[Egress] Sending message to ${chatId} for run ${runId}`);

        try {
            // 2. Call WhatsApp Send API
            const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: chatId,
                    type: "text",
                    text: { body: text },
                }),
            });

            const responseData = await response.json() as any;

            if (!response.ok) {
                throw new Error(`WhatsApp API Error: ${JSON.stringify(responseData)}`);
            }

            const sendId = responseData.messages?.[0]?.id || "unknown";

            // 3. Mark successful in DB
            db.prepare(`
                UPDATE outbound_messages 
                SET status = 'sent', send_id = ? 
                WHERE id = ?
            `).run(sendId, id);

        } catch (error: any) {
            console.error(`[Egress] Failed to send message: ${error.message}`);
            // Mark failed
            db.prepare(`
                UPDATE outbound_messages 
                SET status = 'failed' 
                WHERE id = ?
            `).run(id);

            // Here we would potentially trigger retries
        }
    }
}
