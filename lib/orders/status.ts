import type { OrderStatus } from "@/types/commerce";

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled", "payment_failed"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
  payment_failed: ["pending", "cancelled"],
};

export function assertStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (!ALLOWED_ORDER_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot move order from ${from} to ${to}`);
  }
}
