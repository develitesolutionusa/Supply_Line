"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { emitCartUpdated } from "@/lib/cart/client";
import { fieldClass } from "@/lib/ui";

type ProductOption = { sku: string; name: string };
type Row = { id: number; sku: string; query: string; qty: string };
type Result = { sku: string; qty: number; ok: boolean; reason?: string };

function matchProducts(products: ProductOption[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return products
    .filter((product) => product.name.toLowerCase().includes(needle))
    .slice(0, 8);
}

function resolveSku(products: ProductOption[], row: Row) {
  if (row.sku) {
    const selected = products.find((product) => product.sku === row.sku);
    if (selected && selected.name.toLowerCase() === row.query.trim().toLowerCase()) {
      return selected.sku;
    }
  }
  const exact = products.find((product) => product.name.toLowerCase() === row.query.trim().toLowerCase());
  return exact?.sku ?? "";
}

function ProductSearch({
  products,
  row,
  index,
  onChange,
}: {
  products: ProductOption[];
  row: Row;
  index: number;
  onChange: (next: Pick<Row, "sku" | "query">) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const matches = matchProducts(products, row.query);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <label className="sr-only" htmlFor={fieldId}>
        Search product name row {index + 1}
      </label>
      <input
        id={fieldId}
        type="search"
        autoComplete="off"
        className={fieldClass.INPUT}
        value={row.query}
        placeholder="Search product name"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange({ sku: "", query: event.target.value });
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && matches[0]) {
            event.preventDefault();
            onChange({ sku: matches[0].sku, query: matches[0].name });
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 ? (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Product matches"
        >
          {matches.map((product) => (
            <li key={product.sku}>
              <button
                type="button"
                role="option"
                className="flex w-full px-3 py-2 text-left text-sm text-navy hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
                onClick={() => {
                  onChange({ sku: product.sku, query: product.name });
                  setOpen(false);
                }}
              >
                {product.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && row.query.trim() && matches.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">No products match that name.</p>
      ) : null}
    </div>
  );
}

export function QuickOrderForm({ products }: { products: ProductOption[] }) {
  const [rows, setRows] = useState<Row[]>([{ id: 1, sku: "", query: "", qty: "1" }]);
  const [results, setResults] = useState<Result[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((current) => [...current, { id: Date.now(), sku: "", query: "", qty: "1" }]);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  async function submit() {
    setPending(true);
    setError(null);
    setResults(null);
    try {
      const payload = rows
        .map((row) => ({ sku: resolveSku(products, row), qty: Number(row.qty) }))
        .filter((row) => row.sku);
      const response = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.href = `/sign-in?redirect_url=/quick-order`;
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Quick order failed");
      setResults(data.results);
      emitCartUpdated();
      setToast(`Added ${data.added} row${data.added === 1 ? "" : "s"}. Skipped ${data.skipped}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Quick order failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product name</th>
              <th className="px-4 py-3">Cases</th>
              <th className="px-4 py-3">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const sku = resolveSku(products, row);
              const result = results?.find((item) => item.sku.toLowerCase() === sku.toLowerCase());
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <ProductSearch
                      products={products}
                      row={row}
                      index={index}
                      onChange={(next) =>
                        setRows((current) =>
                          current.map((item) => (item.id === row.id ? { ...item, ...next } : item)),
                        )
                      }
                    />
                    {result && !result.ok ? (
                      <p className="mt-1 text-xs text-rose-700">{result.reason}</p>
                    ) : null}
                    {result?.ok ? <p className="mt-1 text-xs text-emerald-700">Added</p> : null}
                  </td>
                  <td className="w-32 px-4 py-3">
                    <label className="sr-only" htmlFor={`qty-${row.id}`}>
                      Quantity row {index + 1}
                    </label>
                    <input
                      id={`qty-${row.id}`}
                      type="number"
                      min={1}
                      className={fieldClass.INPUT}
                      value={row.qty}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, qty: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="w-24 px-4 py-3">
                    <button
                      type="button"
                      className="text-sm text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                      onClick={() => removeRow(row.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={fieldClass.GHOST} onClick={addRow}>
          Add another product
        </button>
        <button
          type="button"
          disabled={pending}
          className={fieldClass.BUTTON}
          onClick={() => void submit()}
        >
          {pending ? "Adding…" : "Add all to cart"}
        </button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
