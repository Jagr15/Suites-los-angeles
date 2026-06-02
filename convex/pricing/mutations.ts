import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

function normalizeNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = normalizeNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rangesOverlap(
  left: { minQty: number; maxQty?: number },
  right: { minQty: number; maxQty?: number }
) {
  const leftMax = typeof left.maxQty === "number" ? left.maxQty : Number.POSITIVE_INFINITY;
  const rightMax = typeof right.maxQty === "number" ? right.maxQty : Number.POSITIVE_INFINITY;
  return left.minQty <= rightMax && right.minQty <= leftMax;
}

async function resolveNextVersion(
  ctx: MutationCtx,
  tableName: "pricingProductTiers" | "pricingZoneMargins" | "pricingCustomerLevels",
  currentVersion?: number
) {
  if (typeof currentVersion === "number" && Number.isFinite(currentVersion)) {
    return currentVersion;
  }
  const rows = await ctx.db.query(tableName).collect();
  const maxVersion = rows.reduce((acc, row) => Math.max(acc, row.ruleVersion || 0), 0);
  return maxVersion + 1;
}

async function assertNoTierOverlap(
  ctx: MutationCtx,
  args: {
    id?: Id<"pricingProductTiers">;
    productId: Id<"products">;
    minQty: number;
    maxQty?: number;
  }
) {
  const tiers = await ctx.db
    .query("pricingProductTiers")
    .withIndex("by_productId", (q) => q.eq("productId", args.productId))
    .collect();

  const conflict = tiers.find((tier) => {
    if (args.id && tier._id === args.id) return false;
    return rangesOverlap(
      { minQty: args.minQty, maxQty: args.maxQty },
      { minQty: tier.minQty, maxQty: tier.maxQty ?? undefined }
    );
  });

  if (conflict) {
    throw new Error("El rango de cantidad se solapa con otro rango del mismo producto.");
  }
}

async function assertUniqueActiveMunicipality(
  ctx: MutationCtx,
  args: {
    id?: Id<"pricingZoneMargins">;
    municipalityId: string;
    active: boolean;
  }
) {
  if (!args.active) return;
  const margins = await ctx.db.query("pricingZoneMargins").collect();
  const conflict = margins.find((margin) => {
    if (args.id && margin._id === args.id) return false;
    return (
      margin.active &&
      String(margin.municipalityId || margin.scopeKey) === args.municipalityId
    );
  });
  if (conflict) {
    throw new Error("Ya existe un margen activo para este municipio.");
  }
}

async function assertUniqueLevelCode(
  ctx: MutationCtx,
  args: {
    id?: Id<"pricingCustomerLevels">;
    code: string;
  }
) {
  const levels = await ctx.db
    .query("pricingCustomerLevels")
    .withIndex("by_code", (q) => q.eq("code", args.code))
    .collect();
  const conflict = levels.find((level) => !args.id || level._id !== args.id);
  if (conflict) {
    throw new Error("El código del nivel ya existe.");
  }
}

export const upsertProductTier = mutation({
  args: {
    id: v.optional(v.id("pricingProductTiers")),
    productId: v.id("products"),
    minQty: v.number(),
    maxQty: v.optional(v.number()),
    basePrice: v.number(),
    active: v.boolean(),
    ruleVersion: v.optional(v.number()),
    effectiveFrom: v.optional(v.string()),
    effectiveTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const minQty = normalizeNumber(args.minQty);
    if (minQty <= 0) throw new Error("La cantidad mínima debe ser mayor a 0.");

    const maxQty = normalizeOptionalNumber(args.maxQty);
    if (typeof maxQty === "number" && maxQty < minQty) {
      throw new Error("La cantidad máxima debe ser mayor o igual a la mínima.");
    }

    const basePrice = normalizeNumber(args.basePrice);
    if (basePrice < 0) throw new Error("El precio base no puede ser negativo.");

    await assertNoTierOverlap(ctx, {
      id: args.id,
      productId: args.productId,
      minQty,
      maxQty,
    });

    const ruleVersion = await resolveNextVersion(ctx, "pricingProductTiers", args.ruleVersion);
    const payload = {
      productId: args.productId,
      minQty,
      maxQty,
      basePrice,
      active: args.active,
      ruleVersion,
      effectiveFrom: args.effectiveFrom,
      effectiveTo: args.effectiveTo,
      notes: args.notes,
    };

    if (args.id) {
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    return await ctx.db.insert("pricingProductTiers", payload);
  },
});

export const removeProductTier = mutation({
  args: { id: v.id("pricingProductTiers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const upsertZoneMargin = mutation({
  args: {
    id: v.optional(v.id("pricingZoneMargins")),
    stateId: v.string(),
    stateName: v.string(),
    municipalityId: v.string(),
    municipalityName: v.string(),
    zoneKey: v.union(v.literal("Zona 1"), v.literal("Zona 2"), v.literal("Zona 3")),
    zoneName: v.string(),
    marginType: v.literal("fijo"),
    marginAmount: v.number(),
    active: v.boolean(),
    ruleVersion: v.optional(v.number()),
    effectiveFrom: v.optional(v.string()),
    effectiveTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const marginAmount = normalizeNumber(args.marginAmount);
    if (marginAmount < 0) throw new Error("El margen no puede ser negativo.");

    await assertUniqueActiveMunicipality(ctx, {
      id: args.id,
      municipalityId: args.municipalityId,
      active: args.active,
    });

    const ruleVersion = await resolveNextVersion(ctx, "pricingZoneMargins", args.ruleVersion);
    const payload = {
      scopeType: "municipality" as const,
      scopeKey: args.municipalityId,
      scopeLabel: `${args.municipalityName}, ${args.stateName}`,
      stateId: args.stateId,
      stateName: args.stateName,
      municipalityId: args.municipalityId,
      municipalityName: args.municipalityName,
      zoneKey: args.zoneKey,
      zoneName: args.zoneName,
      marginType: args.marginType,
      marginAmount,
      active: args.active,
      ruleVersion,
      effectiveFrom: args.effectiveFrom,
      effectiveTo: args.effectiveTo,
      notes: args.notes,
    };

    if (args.id) {
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    return await ctx.db.insert("pricingZoneMargins", payload);
  },
});

export const removeZoneMargin = mutation({
  args: { id: v.id("pricingZoneMargins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const upsertCustomerLevel = mutation({
  args: {
    id: v.optional(v.id("pricingCustomerLevels")),
    code: v.string(),
    name: v.string(),
    discountPct: v.number(),
    active: v.boolean(),
    ruleVersion: v.optional(v.number()),
    minMonthlyAmount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const discountPct = normalizeNumber(args.discountPct);
    if (discountPct < 0 || discountPct > 100) {
      throw new Error("El descuento debe estar entre 0 y 100.");
    }

    const minMonthlyAmount = normalizeOptionalNumber(args.minMonthlyAmount);
    if (typeof minMonthlyAmount === "number" && minMonthlyAmount < 0) {
      throw new Error("La meta mensual no puede ser negativa.");
    }

    await assertUniqueLevelCode(ctx, { id: args.id, code: args.code });
    const ruleVersion = await resolveNextVersion(ctx, "pricingCustomerLevels", args.ruleVersion);
    const payload = {
      code: args.code.trim(),
      name: args.name.trim(),
      discountPct,
      active: args.active,
      ruleVersion,
      minMonthlyAmount,
      description: args.description,
    };

    if (args.id) {
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    return await ctx.db.insert("pricingCustomerLevels", payload);
  },
});

export const removeCustomerLevel = mutation({
  args: { id: v.id("pricingCustomerLevels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const setPricingSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pricingSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    const payload = {
      key: args.key.trim(),
      value: args.value,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("pricingSettings", payload);
  },
});
