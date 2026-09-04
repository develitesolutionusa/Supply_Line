export type StripeWebhookAction =
  | { action: "mark_paid"; paymentIntentId: string; orderId: string | null }
  | { action: "mark_failed"; paymentIntentId: string; orderId: string | null }
  | { action: "ignore"; type: string };

type PaymentLike = {
  id?: string;
  metadata?: { order_id?: string | null } | null;
};

export function stripeWebhookAction(event: { type: string; data: { object: unknown } }): StripeWebhookAction {
  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as PaymentLike;
    const paymentIntentId = intent.id ?? "";
    const orderId = intent.metadata?.order_id || null;
    return {
      action: event.type === "payment_intent.succeeded" ? "mark_paid" : "mark_failed",
      paymentIntentId,
      orderId,
    };
  }

  return { action: "ignore", type: event.type };
}