export async function sendOrderConfirmation(orderId: string, email: string | null) {
  console.info("[email] order confirmation", {
    orderId,
    email,
    provider: process.env.RESEND_API_KEY ? "resend" : "log",
  });
}

export async function sendLowStockAlert(sku: string, quantity: number) {
  console.info("[email] low-stock alert", { sku, quantity });
}
