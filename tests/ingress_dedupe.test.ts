import { describe, it, expect } from "vitest";
import { IngressGateway } from "../src/gateways/ingress.js";
import { db, initDB } from "../src/db/schema.js";

describe("IngressGateway Dedupe", () => {
    it("should not process duplicate message IDs", async () => {
        initDB();
        const msgId = "test-msg-" + Date.now();
        const chatId = "test-chat-" + Date.now();

        await IngressGateway.handleIncomingMessage({
            messageId: msgId,
            chatId,
            text: "Hello",
            timestamp: "123"
        });

        // The first insert should create a pending/processed event
        const count1 = db.prepare("SELECT count(*) as c FROM inbound_events WHERE message_id = ?").get(msgId) as any;
        expect(count1.c).toBe(1);

        // Send again
        await IngressGateway.handleIncomingMessage({
            messageId: msgId,
            chatId,
            text: "Hello",
            timestamp: "123"
        });

        // The second insert should be ignored, count remains 1
        const count2 = db.prepare("SELECT count(*) as c FROM inbound_events WHERE message_id = ?").get(msgId) as any;
        expect(count2.c).toBe(1);
    });
});
