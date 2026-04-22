"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStripeSignature = verifyStripeSignature;
const crypto_1 = require("crypto");
function parseStripeSignatureHeader(header) {
    const parts = header.split(",").map((value) => value.trim());
    const timestamp = parts
        .find((part) => part.startsWith("t="))
        ?.slice(2);
    const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);
    if (!timestamp || !v1) {
        return null;
    }
    return { timestamp, v1 };
}
function verifyStripeSignature(input) {
    if (!input.signatureHeader) {
        return false;
    }
    const parsed = parseStripeSignatureHeader(input.signatureHeader);
    if (!parsed) {
        return false;
    }
    const tolerance = input.toleranceSeconds ?? 300;
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(parsed.timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > tolerance) {
        return false;
    }
    const signedPayload = `${parsed.timestamp}.${input.payload}`;
    const digest = (0, crypto_1.createHmac)("sha256", input.secret)
        .update(signedPayload, "utf8")
        .digest("hex");
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(digest), Buffer.from(parsed.v1));
    }
    catch {
        return false;
    }
}
