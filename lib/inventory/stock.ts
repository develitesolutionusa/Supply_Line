export type StockCheckItem = {
  sku: string;
  cases: number;
  quantity_on_hand: number;
  stock_status?: string;
};

export function cartLineStockError(item: StockCheckItem): string | null {
  if (item.stock_status !== "out_of_stock" && item.quantity_on_hand >= item.cases) {
    return null;
  }
  if (item.quantity_on_hand <= 0) {
    return `${item.sku} is out of stock.`;
  }
  return `${item.sku}: only ${item.quantity_on_hand} cases available (requested ${item.cases}).`;
}

export function assertCartHasStock(items: StockCheckItem[]) {
  const messages = items.map(cartLineStockError).filter((message): message is string => Boolean(message));
  if (messages.length) {
    throw new Error(messages.join(" "));
  }
}
