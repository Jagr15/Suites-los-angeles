import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  FIXED_CUSTOMER_LEVELS,
  type FixedCustomerLevelCode,
  isFixedCustomerLevelCode,
} from "../../shared/pricing/customer-levels";

type PricingCustomerLevelDoc = Doc<"pricingCustomerLevels">;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

async function getLevelByCode(ctx: MutationCtx, code: FixedCustomerLevelCode) {
  const normalizedCode = normalizeCode(code);
  const levels = await ctx.db.query("pricingCustomerLevels").collect();
  return (
    levels.find((level) => {
      const candidateCode = typeof level.code === "string" ? normalizeCode(level.code) : "";
      return candidateCode === normalizedCode;
    }) || null
  );
}

export async function ensureFixedCustomerLevels(ctx: MutationCtx) {
  const levels = await ctx.db.query("pricingCustomerLevels").collect();
  const byCode = new Map(
    levels
      .filter((level) => typeof level.code === "string" && level.code.trim().length > 0)
      .map((level) => [normalizeCode(level.code), level] as const)
  );
  const ensured: PricingCustomerLevelDoc[] = [];
  const skipped: Array<{ code: string; reason: string }> = [];
  const errors: Array<{ code: string; reason: string }> = [];

  for (const fixed of FIXED_CUSTOMER_LEVELS) {
    const existing = byCode.get(normalizeCode(fixed.code));
    if (existing) {
      const patch: Partial<PricingCustomerLevelDoc> = {};
      if (existing.code !== fixed.code) patch.code = fixed.code;
      if (existing.name !== fixed.name) patch.name = fixed.name;
      if (existing.active !== true) patch.active = true;
      if (
        typeof existing.monthlyLimit !== "number" &&
        typeof existing.minMonthlyAmount !== "number" &&
        typeof fixed.monthlyLimit === "number"
      ) {
        patch.monthlyLimit = fixed.monthlyLimit;
        patch.minMonthlyAmount = fixed.monthlyLimit;
      }
      if (Object.keys(patch).length > 0) {
        try {
          await ctx.db.patch(existing._id, patch);
        } catch (error) {
          errors.push({
            code: fixed.code,
            reason: error instanceof Error ? error.message : "No se pudo actualizar el nivel fijo.",
          });
        }
      }
      const refreshed = await ctx.db.get(existing._id);
      if (refreshed) {
        ensured.push(refreshed);
      } else {
        skipped.push({ code: fixed.code, reason: "El nivel existente no pudo recargarse." });
      }
      continue;
    }

    try {
      const id = await ctx.db.insert("pricingCustomerLevels", {
        code: fixed.code,
        name: fixed.name,
        discountPct: 0,
        active: true,
        ruleVersion: 1,
        monthlyLimit: fixed.monthlyLimit,
        minMonthlyAmount: fixed.monthlyLimit,
        description: undefined,
      });
      const created = await ctx.db.get(id);
      if (created) {
        ensured.push(created);
      } else {
        skipped.push({ code: fixed.code, reason: "El nivel fijo se insertó pero no pudo recargarse." });
      }
    } catch (error) {
      errors.push({
        code: fixed.code,
        reason: error instanceof Error ? error.message : "No se pudo insertar el nivel fijo.",
      });
    }
  }

  return {
    synced: ensured.length,
    skipped: skipped.length,
    errors: errors.length,
    items: ensured,
    details: { skipped, errors },
  };
}

export async function getFixedCustomerLevelId(
  ctx: MutationCtx,
  code: FixedCustomerLevelCode
): Promise<Id<"pricingCustomerLevels"> | null> {
  if (!isFixedCustomerLevelCode(code)) return null;
  const level = await getLevelByCode(ctx, code);
  return level ? level._id : null;
}

export async function getFixedCustomerLevelByCode(
  ctx: MutationCtx,
  code: FixedCustomerLevelCode
) {
  if (!isFixedCustomerLevelCode(code)) return null;
  return await getLevelByCode(ctx, code);
}
