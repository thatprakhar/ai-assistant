import { describe, it, expect } from "vitest";
import { verifyWhatsAppSignature } from "../src/server/webhook.js";
import crypto from "crypto";

describe("verifyWhatsAppSignature", () => {
    it("should return true for a valid signature", () => {
        const secret = "my_secret_key";
        const bodyStr = JSON.stringify({ hello: "world" });
        const rawBody = Buffer.from(bodyStr, "utf8");

        const hmac = crypto.createHmac("sha256", secret);
        const validSignature = `sha256=${hmac.update(rawBody).digest("hex")}`;

        expect(verifyWhatsAppSignature(rawBody, validSignature, secret)).toBe(true);
    });

    it("should return false for an invalid signature", () => {
        const secret = "my_secret_key";
        const rawBody = Buffer.from("random", "utf8");
        expect(verifyWhatsAppSignature(rawBody, "sha256=invalid", secret)).toBe(false);
    });
});
