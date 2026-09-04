export function pageBounds(page: number, limit: number, total: number, maxLimit = 48) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(maxLimit, Math.max(1, limit));
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / safeLimit));
  const start = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, total_pages: totalPages, start };
}