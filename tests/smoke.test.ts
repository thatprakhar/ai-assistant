import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fetch } from "undici";
import { startServer, fastify } from "../src/server/webhook.js";
import { initDB, db } from "../src/db/schema.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Mute console logs for cleaner test output
const originalConsoleLog = console.log;
beforeAll(async () => {
    console.log = () => { };
    initDB();
    process.env.WHATSAPP_VERIFY_SIGNATURES = "true";
    // Secret defaults to test-app-secret in webhook module on import
    await startServer();
    await new Promise(r => setTimeout(r, 500));
});

afterAll(async () => {
    console.log = originalConsoleLog;
    await fastify.close();
});

describe("Smoke Test", () => {
    it("should process a webhook end-to-end and insert outbound message", async () => {
        const payload = {
            object: "whatsapp_business_account",
            entry: [{
                changes: [{
                    value: {
                        metadata: { phone_number_id: "123" },
                        messages: [{
                            from: "smoke-chat",
                            id: "smoke-" + Date.now(),
                            timestamp: Date.now().toString(),
                            text: { body: "Smoke test building feature" }
                        }]
                    }
                }]
            }]
        };

        const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
        const hmac = crypto.createHmac("sha256", "test-app-secret");
        const signature = `sha256=${hmac.update(rawBody).digest("hex")}`;

        const res = await fetch("http://127.0.0.1:3000/webhook", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hub-signature-256": signature
            },
            body: rawBody
        });

        expect(res.status).toBe(200);

        // Wait a bit for the async flow and agent orchestrator to finish
        await new Promise(r => setTimeout(r, 2000));

        // Assert outbound row exists
        const out = db.prepare("SELECT * FROM outbound_messages WHERE chat_id = ?").get("smoke-chat") as any;
        expect(out).toBeDefined();
        // Since it's a LONG_JOB ("build feature"), we should see a 'queued' outbound message about background task.
        expect(out.payload).toContain("background task");
    });
});
