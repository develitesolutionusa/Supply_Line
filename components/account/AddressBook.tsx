"use client";

import { useState } from "react";
import { fieldClass } from "@/lib/ui";
import type { AddressRecord } from "@/types/commerce";

export function AddressBook({ initial }: { initial: AddressRecord[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    label: "Shipping",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });

  async function save() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, is_default: addresses.length === 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save address");
      setAddresses((current) => [...current, data.address]);
      setForm({ label: "Shipping", line1: "", line2: "", city: "", state: "", zip: "" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save address");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-navy">Saved addresses</h2>
      {addresses.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No saved addresses yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <p className="font-medium text-navy">{address.label}</p>
              <p className="mt-1 text-slate-600">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.zip}
              </p>
              {address.is_default ? <p className="mt-2 text-xs font-semibold text-sky-dark">Default</p> : null}
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="sm:col-span-2">
          <label className={fieldClass.LABEL} htmlFor="new-label">
            Label
          </label>
          <input
            id="new-label"
            className={fieldClass.INPUT}
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={fieldClass.LABEL} htmlFor="new-line1">
            Address
          </label>
          <input
            id="new-line1"
            required
            className={fieldClass.INPUT}
            value={form.line1}
            onChange={(event) => setForm({ ...form, line1: event.target.value })}
          />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="new-city">
            City
          </label>
          <input
            id="new-city"
            required
            className={fieldClass.INPUT}
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="new-state">
            State
          </label>
          <input
            id="new-state"
            required
            maxLength={2}
            className={fieldClass.INPUT}
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })}
          />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="new-zip">
            ZIP
          </label>
          <input
            id="new-zip"
            required
            className={fieldClass.INPUT}
            value={form.zip}
            onChange={(event) => setForm({ ...form, zip: event.target.value })}
          />
        </div>
        {error ? <p className="sm:col-span-2 text-sm text-rose-700">{error}</p> : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-muted disabled:bg-slate-300"
          >
            {pending ? "Saving…" : "Save address"}
          </button>
        </div>
      </form>
    </section>
  );
}
