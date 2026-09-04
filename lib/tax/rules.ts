import { TAX_RULES, type TaxRuleMap } from "@/lib/pricing";
import { logError } from "@/lib/observability";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

type TaxRuleRow = {
  state_code?: string | null;
  rate_percent?: number | string | null;
};

export function taxRulesFromRows(rows: TaxRuleRow[]): TaxRuleMap {
  const rules: TaxRuleMap = {};
  for (const row of rows) {
    const state = row.state_code?.trim().toUpperCase();
    if (!state) continue;
    const rate = typeof row.rate_percent === "number" ? row.rate_percent : Number(row.rate_percent);
    if (!Number.isFinite(rate)) continue;
    rules[state] = rate;
  }
  return rules;
}

export async function loadTaxRules(): Promise<TaxRuleMap> {
  if (!isSupabaseConfigured()) {
    return TAX_RULES;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("tax_rules").select("state_code, rate_percent");
    if (error) {
      logError("tax.loadTaxRules", error);
      return TAX_RULES;
    }
    const mapped = taxRulesFromRows(data ?? []);
    return Object.keys(mapped).length > 0 ? mapped : TAX_RULES;
  } catch (error) {
    logError("tax.loadTaxRules", error);
    return TAX_RULES;
  }
}
