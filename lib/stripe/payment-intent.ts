export function paymentIntentCreateParams(options: {
  amountCents: number;
  orderId: string;
  userId: string;
  customerId?: string;
}) {
  if (!Number.isInteger(options.amountCents) || options.amountCents < 1) {
    throw new Error("Payment amount must be a positive integer in cents.");
  }

  return {
    amount: options.amountCents,
    currency: "usd" as const,
    automatic_payment_methods: { enabled: true },
    metadata: {
      order_id: options.orderId,
      user_id: options.userId,
    },
    ...(options.customerId ? { customer: options.customerId } : {}),
  };
}