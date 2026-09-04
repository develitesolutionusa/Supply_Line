"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { emitCartUpdated } from "@/lib/cart/client";
import { fieldClass } from "@/lib/ui";

type Row = { id: number; sku: string; qty: string };
type Result = { sku: string; qty: number; ok: boolean; reason?: string };

export function QuickOrderForm() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, sku: "", qty: "1" },
    { id: 2, sku: "", qty: "1" },
  ]);
  const [results, setResults] = useState<Result[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((current) => [...current, { id: Date.now(), sku: "", qty: "1" }]);
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
        .filter((row) => row.sku.trim())
        .map((row) => ({ sku: row.sku.trim(), qty: Number(row.qty) }));
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
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Cases</th>
              <th className="px-4 py-3">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const result = results?.find(
                (item) => item.sku.toLowerCase() === row.sku.trim().toLowerCase(),
              );
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`sku-${row.id}`}>
                      SKU row {index + 1}
                    </label>
                    <input
                      id={`sku-${row.id}`}
                      className={fieldClass.INPUT}
                      value={row.sku}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, sku: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="PLS-DELI-32"
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
        <button
          type="button"
          className={fieldClass.GHOST}
          onClick={addRow}
        >
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
