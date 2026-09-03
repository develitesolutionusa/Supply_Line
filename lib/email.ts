import { formatCents } from "@/lib/pricing";
import type { OrderRecord } from "@/types/commerce";

function fromAddress() {
  return process.env.EMAIL_FROM || "SupplyLine <beth.t@example.com>";
}

async function sendResendEmail(payload: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email] skipped (no RESEND_API_KEY)", {
      to: payload.to,
      subject: payload.subject,
    });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend failed (${response.status}): ${detail}`);
  }
}

export async function sendOrderConfirmation(order: OrderRecord, email: string | null) {
  if (!email) {
    console.info("[email] order confirmation skipped (no buyer email)", { orderId: order.id });
    return;
  }

  const items = order.items
    .map(
      (item) =>
        `<li>${item.cases} × ${item.name} (${item.sku}) — ${formatCents(item.unit_price_cents_at_purchase * item.cases)}</li>`,
    )
    .join("");

  try {
    await sendResendEmail({
      to: email,
      subject: `Order confirmed · ${order.id.slice(0, 8)}`,
      html: `
        <p>Thanks for your SupplyLine order.</p>
        <p><strong>Order:</strong> ${order.id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <ul>${items}</ul>
        <p><strong>Total:</strong> ${formatCents(order.total_cents)}</p>
      `,
    });
    console.info("[email] order confirmation sent", { orderId: order.id, to: email });
  } catch (error) {
    console.error("[email] order confirmation failed", error);
  }
}

export async function sendLowStockAlert(sku: string, quantity: number, name?: string) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) {
    console.info("[email] low-stock alert skipped (no ADMIN_ALERT_EMAIL)", { sku, quantity });
    return;
  }

  try {
    await sendResendEmail({
      to,
      subject: `Low stock · ${sku}`,
      html: `
        <p>Inventory crossed the low-stock threshold.</p>
        <p><strong>Product:</strong> ${name ?? sku}</p>
        <p><strong>SKU:</strong> ${sku}</p>
        <p><strong>Quantity on hand:</strong> ${quantity}</p>
      `,
    });
    console.info("[email] low-stock alert sent", { sku, quantity, to });
  } catch (error) {
    console.error("[email] low-stock alert failed", error);
  }
}
