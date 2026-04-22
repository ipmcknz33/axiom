"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const plan_mapping_1 = require("../server/billing/stripe/plan-mapping");
(0, node_test_1.default)("plan mapping resolves configured Stripe price IDs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    process.env.STRIPE_PRICE_PREMIUM = "price_premium";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    process.env.STRIPE_PRICE_BUSINESS = "price_business";
    strict_1.default.equal((0, plan_mapping_1.getStripePriceIdForPlan)("premium"), "price_premium");
    strict_1.default.equal((0, plan_mapping_1.getStripePriceIdForPlan)("pro"), "price_pro");
    strict_1.default.equal((0, plan_mapping_1.getStripePriceIdForPlan)("business"), "price_business");
    const reverse = (0, plan_mapping_1.getStripePriceToPlanMap)();
    strict_1.default.equal(reverse.price_premium, "premium");
    strict_1.default.equal(reverse.price_pro, "pro");
    strict_1.default.equal(reverse.price_business, "business");
});
