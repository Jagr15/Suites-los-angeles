import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

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
    return [...levels].sort((a, b) => a.code.localeCompare(b.code));
  },
});

export const listSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("pricingSettings").collect();
    return [...settings].sort((a, b) => a.key.localeCompare(b.key));
  },
});
