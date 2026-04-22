import assert from "node:assert/strict";
import test from "node:test";

import {
  getStripePriceIdForPlan,
  getStripePriceToPlanMap,
} from "../server/billing/stripe/plan-mapping";

test("plan mapping resolves configured Stripe price IDs", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
  process.env.STRIPE_PRICE_PREMIUM = "price_premium";
  process.env.STRIPE_PRICE_PRO = "price_pro";
  process.env.STRIPE_PRICE_BUSINESS = "price_business";

  assert.equal(getStripePriceIdForPlan("premium"), "price_premium");
  assert.equal(getStripePriceIdForPlan("pro"), "price_pro");
  assert.equal(getStripePriceIdForPlan("business"), "price_business");

  const reverse = getStripePriceToPlanMap();
  assert.equal(reverse.price_premium, "premium");
  assert.equal(reverse.price_pro, "pro");
  assert.equal(reverse.price_business, "business");
});
