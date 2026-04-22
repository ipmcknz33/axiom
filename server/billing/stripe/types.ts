export type StripeEventType =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_failed";

export type StripeWebhookEvent = {
  created?: number;
  data: {
    object: Record<string, unknown>;
  };
  id: string;
  type: StripeEventType | string;
};

export type BillingTransition = {
  accessStatus: "active" | "inactive" | "expired";
  billingStatus?: string;
  eventId: string;
  eventType: string;
  plan: "free" | "trial" | "premium" | "pro" | "business";
  role?: "owner" | "admin" | "member" | "internal";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  userId?: string;
};

export type BillingProcessorOutcome = {
  deduped: boolean;
  reason?: string;
  status: "failed" | "ignored" | "processed";
};
