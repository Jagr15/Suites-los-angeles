import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  FIXED_CUSTOMER_LEVELS,
  type FixedCustomerLevelCode,
  isFixedCustomerLevelCode,
} from "../../shared/pricing/customer-levels";
import { ensureFixedCustomerLevels } from "./customer_levels";

function normalizeNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = normalizeNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeLevelCode(value: string) {
  return value.trim().toUpperCase();
}

function rangesOverlap(
  left: { minQty: number; maxQty?: number },
  right: { minQty: number; maxQty?: number }
) {
  const leftMax = typeof left.maxQty === "number" ? left.maxQty : Number.POSITIVE_INFINITY;
  const rightMax = typeof right.maxQty === "number" ? right.maxQty : Number.POSITIVE_INFINITY;
  return left.minQty < rightMax && right.minQty < leftMax;
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

function normalizeFixedMonthlyLimit(value: unknown): number | undefined {
  const parsed = normalizeOptionalNumber(value);
  return typeof parsed === "number" ? parsed : undefined;
}

async function validateFixedCustomerLevels(
  ctx: MutationCtx,
  args: {
    code: FixedCustomerLevelCode;
    monthlyLimit?: number;
  }
) {
  const levels = await ctx.db.query("pricingCustomerLevels").collect();
  const byCode = new Map(
    levels.map((level) => [normalizeLevelCode(level.code), level] as const)
  );

  const candidateLimits = new Map<string, number | undefined>();
  for (const fixed of FIXED_CUSTOMER_LEVELS) {
    const current = byCode.get(fixed.code);
    const limit = fixed.code === args.code
      ? normalizeFixedMonthlyLimit(args.monthlyLimit)
      : normalizeFixedMonthlyLimit(current?.monthlyLimit ?? current?.minMonthlyAmount ?? fixed.monthlyLimit);
    candidateLimits.set(fixed.code, limit);
  }

  const bronze = candidateLimits.get("BRONCE");
  const plata = candidateLimits.get("PLATA");
  const oro = candidateLimits.get("ORO");
  const diamante = candidateLimits.get("DIAMANTE");

  if (typeof bronze !== "number" || bronze <= 0) {
    throw new Error("El límite de Bronce debe ser mayor a 0.");
  }
  if (typeof plata !== "number" || plata <= bronze) {
    throw new Error("El límite de Plata debe ser mayor al de Bronce.");
  }
  if (typeof oro !== "number" || oro <= plata) {
    throw new Error("El límite de Oro debe ser mayor al de Plata.");
  }
  if (typeof diamante !== "number" || diamante <= oro) {
    throw new Error("El límite de Diamante debe ser mayor al de Oro.");
  }
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

export const syncProductPriceRanges = mutation({
  args: {
    productId: v.id("products"),
    ranges: v.array(v.object({
      id: v.optional(v.id("pricingProductTiers")),
      upperLimit: v.number(),
      basePrice: v.number(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Producto no encontrado");

    const existingRanges = await ctx.db
      .query("pricingProductTiers")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const existingById = new Map(existingRanges.map((range) => [range._id, range] as const));
    const normalizedRanges = args.ranges
      .map((range) => ({
        id: range.id,
        upperLimit: normalizeNumber(range.upperLimit),
        basePrice: normalizeNumber(range.basePrice),
        notes: range.notes?.trim() || undefined,
      }))
      .filter((range) => Number.isFinite(range.upperLimit) && range.upperLimit > 0)
      .sort((a, b) => a.upperLimit - b.upperLimit);

    if (normalizedRanges.length === 0) {
      for (const existing of existingRanges) {
        await ctx.db.delete(existing._id);
      }
      return [];
    }

    for (let i = 0; i < normalizedRanges.length; i++) {
      const current = normalizedRanges[i];
      const previous = normalizedRanges[i - 1];
      if (i > 0 && current.upperLimit <= (previous?.upperLimit ?? 0)) {
        throw new Error("Los límites deben ser ascendentes y sin empates.");
      }
      if (current.basePrice < 0) {
        throw new Error("El precio base no puede ser negativo.");
      }
    }

    const ruleVersion = await resolveNextVersion(ctx, "pricingProductTiers");
    const nextIds = new Set(
      normalizedRanges
        .map((range) => range.id)
        .filter((id): id is Id<"pricingProductTiers"> => !!id)
    );

    const synced: Array<Doc<"pricingProductTiers">> = [];
    let lowerBound = 0;
    for (const range of normalizedRanges) {
      const existing = range.id ? existingById.get(range.id) : null;
      const payload = {
        productId: args.productId,
        minQty: lowerBound,
        maxQty: range.upperLimit,
        basePrice: range.basePrice,
        active: true,
        ruleVersion,
        effectiveFrom: existing?.effectiveFrom,
        effectiveTo: existing?.effectiveTo,
        notes: range.notes ?? existing?.notes,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
        const updated = await ctx.db.get(existing._id);
        if (updated) synced.push(updated);
      } else {
        const id = await ctx.db.insert("pricingProductTiers", payload);
        const created = await ctx.db.get(id);
        if (created) synced.push(created);
      }

      lowerBound = range.upperLimit;
    }

    for (const existing of existingRanges) {
      if (!nextIds.has(existing._id)) {
        await ctx.db.delete(existing._id);
      }
    }

    return synced;
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
    code: v.union(
      v.literal("BRONCE"),
      v.literal("PLATA"),
      v.literal("ORO"),
      v.literal("DIAMANTE"),
      v.literal("ULTRA")
    ),
    discountPct: v.number(),
    monthlyLimit: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const code = normalizeLevelCode(args.code) as FixedCustomerLevelCode;
    if (!isFixedCustomerLevelCode(code)) {
      throw new Error("El nivel debe ser uno de los niveles fijos.");
    }

    const discountPct = normalizeNumber(args.discountPct);
    if (discountPct < 0 || discountPct > 100) {
      throw new Error("El descuento debe estar entre 0 y 100.");
    }

    const monthlyLimit = normalizeOptionalNumber(args.monthlyLimit);
    if (code !== "ULTRA") {
      await validateFixedCustomerLevels(ctx, { code, monthlyLimit });
    } else if (typeof monthlyLimit === "number") {
      throw new Error("Ultra no debe tener límite.");
    }

    const fixed = FIXED_CUSTOMER_LEVELS.find((level) => level.code === code);
    if (!fixed) {
      throw new Error("El nivel debe ser fijo.");
    }

    const ruleVersion = await resolveNextVersion(ctx, "pricingCustomerLevels");
    const payload = {
      code,
      name: fixed.name,
      discountPct,
      active: true,
      ruleVersion,
      monthlyLimit,
      minMonthlyAmount: monthlyLimit,
      description: args.description,
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Nivel no encontrado.");
      if (normalizeLevelCode(existing.code) !== code) {
        throw new Error("No se puede cambiar el código de un nivel fijo.");
      }
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    const existingByCode = await ctx.db
      .query("pricingCustomerLevels")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existingByCode) {
      await ctx.db.patch(existingByCode._id, payload);
      return existingByCode._id;
    }

    return await ctx.db.insert("pricingCustomerLevels", payload);
  },
});

export const removeCustomerLevel = mutation({
  args: { id: v.id("pricingCustomerLevels") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    if (isFixedCustomerLevelCode(existing.code)) {
      throw new Error("No se pueden eliminar los niveles fijos.");
    }
    await ctx.db.delete(args.id);
  },
});

export const syncFixedCustomerLevels = mutation({
  args: {},
  handler: async (ctx) => {
    return await ensureFixedCustomerLevels(ctx);
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
