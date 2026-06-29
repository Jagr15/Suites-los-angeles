import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { FIXED_CUSTOMER_LEVEL_ORDER, FIXED_CUSTOMER_LEVELS } from "../../shared/pricing/customer-levels";

async function withProductName(ctx: QueryCtx, tier: Doc<"pricingProductTiers">) {
  const product = tier.productId ? await ctx.db.get(tier.productId) : null;
  return {
    ...tier,
    productName: product?.producto || product?.sku || "Producto eliminado",
  };
}

export const listProductTiers = query({
  args: {},
  handler: async (ctx) => {
    try {
      const tiers = await ctx.db.query("pricingProductTiers").collect();
      const ordered = [...tiers].sort((a, b) => {
        const productCompare = String(a.productId || "").localeCompare(String(b.productId || ""));
        if (productCompare !== 0) return productCompare;
        return Number(a.minQty || 0) - Number(b.minQty || 0);
      });
      return await Promise.all(ordered.map((tier) => withProductName(ctx, tier)));
    } catch (error) {
      console.error("pricing.listProductTiers failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
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
    try {
      const levels = await ctx.db.query("pricingCustomerLevels").collect();
      const byCode = new Map(
        levels
          .filter((level) => typeof level.code === "string" && level.code.trim().length > 0)
          .map((level) => [String(level.code).trim().toUpperCase(), level] as const)
      );
      const orderedLevels = FIXED_CUSTOMER_LEVEL_ORDER.map((code) => {
        const fixed = FIXED_CUSTOMER_LEVELS.find((level) => level.code === code);
        if (!fixed) return null;
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
    } catch (error) {
      console.error("pricing.listCustomerLevels failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const listSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("pricingSettings").collect();
    return [...settings].sort((a, b) => a.key.localeCompare(b.key));
  },
});
