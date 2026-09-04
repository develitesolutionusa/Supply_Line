import { TAX_RULES, type TaxRuleMap } from "@/lib/pricing";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

const CACHE_MS = 60_000;
let cached: { at: number; rules: TaxRuleMap } | null = null;

export function taxRulesFromRows(rows: { state_code: string; rate_percent: number }[]): TaxRuleMap {
  const rules: TaxRuleMap = {};
  for (const row of rows) {
    const code = row.state_code.trim().toUpperCase();
    if (!code) continue;
    rules[code] = Number(row.rate_percent);
  }
  return rules;
}

export function clearTaxRulesCache() {
  cached = null;
}

export async function loadTaxRules(): Promise<TaxRuleMap> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.rules;
  }

  if (!isSupabaseConfigured()) {
    return { ...TAX_RULES };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("tax_rules").select("state_code, rate_percent");
    if (error || !data?.length) {
      const fallback = { ...TAX_RULES };
      cached = { at: Date.now(), rules: fallback };
      return fallback;
    }
    const rules = taxRulesFromRows(data);
    const resolved = Object.keys(rules).length > 0 ? rules : { ...TAX_RULES };
    cached = { at: Date.now(), rules: resolved };
    return resolved;
  } catch {
    return { ...TAX_RULES };
  }
}
