"use client";

import { useEffect, useState } from "react";

type Account = {
  id: string;
  company_name: string;
  tax_exempt: boolean;
};

export function BusinessAccountTable() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/business-accounts");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load accounts");
      return;
    }
    setAccounts(data.accounts);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string, taxExempt: boolean) {
    const response = await fetch(`/api/admin/business-accounts/${id}/tax-exempt`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tax_exempt: taxExempt }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Update failed");
      return;
    }
    await load();
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {accounts.length === 0 ? (
        <p className="text-sm text-slate-600">No business accounts yet. They appear after org signup or checkout.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Org ID</th>
                <th className="px-4 py-3">Tax-exempt</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{account.company_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{account.id}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={account.tax_exempt}
                        onChange={(event) => void toggle(account.id, event.target.checked)}
                      />
                      <span>{account.tax_exempt ? "Exempt" : "Taxable"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
