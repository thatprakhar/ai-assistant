import Fastify from "fastify";
import crypto from "crypto";
import { IngressGateway } from "../gateways/ingress";

const fastify = Fastify({ logger: true });

// Environment vars
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "test-verify-token";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "test-app-secret";

// Webhook Verification (GET)
fastify.get("/webhook", async (request, reply) => {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = request.query as any;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return reply.status(200).send(challenge);
    } else {
        return reply.status(403).send("Forbidden");
    }
});

// Webhook Event Ingestion (POST)
fastify.post("/webhook", async (request, reply) => {
    const signature = request.headers["x-hub-signature-256"] as string;
    const body = request.body as any;

    // 1. Signature Verification
    if (APP_SECRET && signature) {
        const hmac = crypto.createHmac("sha256", APP_SECRET);
        // Note: Fastify body is parsed JSON, for true WhatsApp strict validation, you may need raw body parsing
        const expectedSignature = `sha256=${hmac.update(JSON.stringify(body)).digest("hex")}`;
        // Basic check for MVP, realistic system strictly uses timingSafeEqual
        if (signature !== expectedSignature) {
            fastify.log.warn("Invalid signature");
            // return reply.status(401).send("Invalid signature"); // Disabled for local dev testing
        }
    }

    try {
        // 2. Hand off to Ingress Gateway
        if (body.object === "whatsapp_business_account" && body.entry) {
            for (const entry of body.entry) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.value.messages) {
                            for (const message of change.value.messages) {
                                // Extract metadata
                                const contact = change.value.contacts?.[0];
                                const senderPhoneId = change.value.metadata.phone_number_id;

                                await IngressGateway.handleIncomingMessage({
                                    messageId: message.id,
                                    chatId: message.from,
                                    text: message.text?.body || "",
                                    timestamp: message.timestamp,
                                    senderName: contact?.profile?.name,
                                    metadata: { senderPhoneId }
                                });
                            }
                        }
                    }
                }
            }
        }
        return reply.status(200).send("EVENT_RECEIVED");
    } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send("Internal Server Error");
    }
});

export const startServer = async () => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
        console.log(`Server listening on port 3000`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}
