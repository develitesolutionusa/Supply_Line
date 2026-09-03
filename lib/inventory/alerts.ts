import { sendLowStockAlert } from "@/lib/email";

export function didCrossLowStockThreshold(
  previousQuantity: number,
  nextQuantity: number,
  threshold: number,
) {
  return previousQuantity > threshold && nextQuantity <= threshold;
}

export async function notifyIfLowStockBreached(input: {
  sku: string;
  name?: string;
  previousQuantity: number;
  nextQuantity: number;
  threshold: number;
}) {
  if (!didCrossLowStockThreshold(input.previousQuantity, input.nextQuantity, input.threshold)) {
    return;
  }
  await sendLowStockAlert(input.sku, input.nextQuantity, input.name);
}
