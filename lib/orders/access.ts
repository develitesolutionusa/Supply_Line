export function canAccessOrder(
  account: { userId: string | null; orgId: string | null },
  order: { user_id: string | null; org_id: string | null },
) {
  if (account.userId && order.user_id === account.userId) return true;
  if (account.orgId && order.org_id === account.orgId) return true;
  return false;
}
