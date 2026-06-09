import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { FIXED_CUSTOMER_LEVEL_ORDER, FIXED_CUSTOMER_LEVELS } from "../../shared/pricing/customer-levels";

async function withProductName(ctx: QueryCtx, tier: Doc<"pricingProductTiers">) {
  const product = await ctx.db.get(tier.productId);
  return {
    ...tier,
    productName: product?.producto || product?.sku || "Producto eliminado",
  };
}

export const listProductTiers = query({
  args: {},
  handler: async (ctx) => {
    const tiers = await ctx.db.query("pricingProductTiers").collect();
    const ordered = [...tiers].sort((a, b) => {
      if (a.productId === b.productId) return a.minQty - b.minQty;
      return String(a.productId).localeCompare(String(b.productId));
    });
    return Promise.all(ordered.map((tier) => withProductName(ctx, tier)));
  },
});

export const listZoneMargins = query({
  args: {},
  handler: async (ctx) => {
    const margins = await ctx.db.query("pricingZoneMargins").collect();
    return [...margins].sort((a, b) => {
      const stateCompare = String(a.stateName || a.stateId || "").localeCompare(String(b.stateName || b.stateId || ""));
      if (stateCompare !== 0) return stateCompare;
      return String(a.municipalityName || a.municipalityId || "").localeCompare(String(b.municipalityName || b.municipalityId || ""));
    });
  },
});

export const listCustomerLevels = query({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db.query("pricingCustomerLevels").collect();
    const byCode = new Map(
      levels.map((level) => [String(level.code).trim().toUpperCase(), level] as const)
    );
    const orderedLevels = FIXED_CUSTOMER_LEVEL_ORDER.map((code) => {
      const fixed = FIXED_CUSTOMER_LEVELS.find((level) => level.code === code)!;
      const level = byCode.get(code);
      if (!level) return null;
      return {
        ...level,
        code: fixed.code,
        name: fixed.name,
        monthlyLimit: level.monthlyLimit ?? level.minMonthlyAmount ?? fixed.monthlyLimit,
      };
    });
    return orderedLevels.filter(Boolean) as Array<Doc<"pricingCustomerLevels"> & { monthlyLimit?: number }>;
  },
});

export const listSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("pricingSettings").collect();
    return [...settings].sort((a, b) => a.key.localeCompare(b.key));
  },
});
