import dotenv from "dotenv";
import { initDB } from "./db/schema.js";
import { startServer } from "./server/webhook.js";

dotenv.config();

function checkEnv() {
    const required = ["WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_ID", "ANTHROPIC_API_KEY"];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`[WARNING] Missing environment variables: ${missing.join(", ")}`);
        console.warn(`[WARNING] Operating in degraded/local-simulation mode.`);
    } else {
        console.log(`[INFO] All critical environment variables present.`);
    }
}

async function main() {
    console.log("=== AI Company System Initializing ===");
    checkEnv();

    console.log("Initializing Database...");
    initDB();

    console.log("Starting Webhook Server...");
    await startServer();

    console.log("=== System Ready ===");
}

main().catch(err => {
    console.error("Fatal initialization error:", err);
    process.exit(1);
});
