"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fieldClass } from "@/lib/ui";
import type { Category, PriceTier, Product } from "@/types/commerce";

export function ProductEditor({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    description: product?.description ?? "",
    pack_size: product?.pack_size ?? "",
    unit_count: product?.unit_count ?? 1,
    is_active: product?.is_active ?? true,
    low_stock_threshold: product?.low_stock_threshold ?? 5,
    quantity_on_hand: product?.quantity_on_hand ?? 0,
    image_url: product?.image_url ?? "",
    tiers: (product?.price_tiers ?? [
      { min_cases: 1, price_per_case_cents: 1000 },
    ]) as PriceTier[],
  });

  async function save() {
    setPending(true);
    setError(null);
    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        category_id: form.category_id,
        description: form.description,
        pack_size: form.pack_size,
        unit_count: Number(form.unit_count),
        is_active: form.is_active,
        low_stock_threshold: Number(form.low_stock_threshold),
        quantity_on_hand: Number(form.quantity_on_hand),
        image_url: form.image_url || null,
        price_tiers: form.tiers.map((tier) => ({
          min_cases: Number(tier.min_cases),
          price_per_case_cents: Number(tier.price_per_case_cents),
        })),
      };
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    if (!product) return;
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  async function upload(file: File) {
    if (!product) return;
    const body = new FormData();
    body.set("file", file);
    const response = await fetch(`/api/admin/products/${product.id}/image`, { method: "POST", body });
    const data = await response.json();
    if (response.ok) {
      setError(null);
      setForm((current) => ({ ...current, image_url: data.image_url }));
    } else {
      setError(data.error ?? "Image upload failed");
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU" value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} />
        <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <div>
          <label className={fieldClass.LABEL} htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className={fieldClass.INPUT}
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Field label="Pack size" value={form.pack_size} onChange={(value) => setForm({ ...form, pack_size: value })} />
        <Field
          label="Unit count"
          type="number"
          value={String(form.unit_count)}
          onChange={(value) => setForm({ ...form, unit_count: Number(value) })}
        />
        <Field
          label="Low-stock threshold"
          type="number"
          value={String(form.low_stock_threshold)}
          onChange={(value) => setForm({ ...form, low_stock_threshold: Number(value) })}
        />
        {!product ? (
          <Field
            label="Opening inventory"
            type="number"
            value={String(form.quantity_on_hand)}
            onChange={(value) => setForm({ ...form, quantity_on_hand: Number(value) })}
          />
        ) : null}
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
        />
        Active
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-navy">Price tiers (cents per case)</legend>
        <div className="mt-2 space-y-2">
          {form.tiers.map((tier, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="number"
                aria-label={`Min cases tier ${index + 1}`}
                className={fieldClass.INPUT}
                value={tier.min_cases}
                onChange={(event) => {
                  const next = [...form.tiers];
                  next[index] = { ...next[index], min_cases: Number(event.target.value) };
                  setForm({ ...form, tiers: next });
                }}
              />
              <input
                type="number"
                aria-label={`Price cents tier ${index + 1}`}
                className={fieldClass.INPUT}
                value={tier.price_per_case_cents}
                onChange={(event) => {
                  const next = [...form.tiers];
                  next[index] = { ...next[index], price_per_case_cents: Number(event.target.value) };
                  setForm({ ...form, tiers: next });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-sky-dark hover:underline"
          onClick={() =>
            setForm({
              ...form,
              tiers: [...form.tiers, { min_cases: 12, price_per_case_cents: 0 }],
            })
          }
        >
          Add tier
        </button>
      </fieldset>
      {product ? (
        <div>
          <label className={fieldClass.LABEL} htmlFor="image">
            Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {pending ? "Saving…" : "Save product"}
        </button>
        {product ? (
          <button type="button" className="h-11 rounded-lg border border-slate-200 px-4 text-sm" onClick={() => void archive()}>
            Archive
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label className={fieldClass.LABEL} htmlFor={id}>
        {label}
      </label>
      <input id={id} type={type} className={fieldClass.INPUT} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
