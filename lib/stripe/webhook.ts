export type StripeWebhookAction =
  | { action: "mark_paid"; paymentIntentId: string; orderId: string | null; amount?: number }
  | { action: "mark_failed"; paymentIntentId: string; orderId: string | null }
  | { action: "ignore"; type: string };

type PaymentLike = {
  id?: string;
  amount?: number;
  metadata?: { order_id?: string | null } | null;
};

export function paymentIntentAmountMatchesOrder(amount: number | undefined, orderTotalCents: number) {
  if (amount == null) return true;
  return Number.isInteger(amount) && amount === orderTotalCents;
}

export function stripeWebhookAction(event: { type: string; data: { object: unknown } }): StripeWebhookAction {
  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as PaymentLike;
    const paymentIntentId = intent.id ?? "";
    const orderId = intent.metadata?.order_id || null;
    if (event.type === "payment_intent.succeeded") {
      return {
        action: "mark_paid",
        paymentIntentId,
        orderId,
        amount: intent.amount,
      };
    }
    return {
      action: "mark_failed",
      paymentIntentId,
      orderId,
    };
  }

  return { action: "ignore", type: event.type };
}
