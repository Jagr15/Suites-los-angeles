import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  getCustomerLevelForMonthlyAmount as getFixedLevelCodeForMonthlyAmount,
  type ClientType,
} from "../../shared/pricing/customer-levels";

type DbCtx = Pick<MutationCtx, "db">;

export type PricingSource =
  | "dynamic"
  | "legacy_frontend"
  | "legacy_lista1"
  | "legacy_default";

export type CalculateDynamicPriceArgs = {
  productId: Id<"products">;
  quantity: number;
  clientId?: Id<"clients">;
  municipality?: {
    municipalityId?: string;
    stateId?: string;
  };
  legacyUnitPrice?: number;
};

export type PricingResult = {
  basePrice: number;
  zoneMargin: number;
  discountPct: number;
  finalPrice: number;
  pricingSource: PricingSource;
  pricingRuleVersion: number;
};

type PricingSettingsSnapshot = {
  dynamicPricingEnabled: boolean;
  legacyFallbackEnabled: boolean;
};

function normalizeMoney(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizeDiscountPct(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  if (parsed > 1) return Math.min(parsed, 100) / 100;
  return Math.min(parsed, 1);
}

function parseLegacyPrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

async function loadPricingSettings(ctx: DbCtx): Promise<PricingSettingsSnapshot> {
  const settings = await ctx.db.query("pricingSettings").collect();
  const settingsMap = new Map(settings.map((item) => [item.key, item.value]));

  return {
    dynamicPricingEnabled: settingsMap.get("dynamicPricingEnabled") !== "false",
    legacyFallbackEnabled: settingsMap.get("legacyFallbackEnabled") !== "false",
  };
}

async function getClientDoc(ctx: DbCtx, clientId?: Id<"clients">): Promise<Doc<"clients"> | null> {
  if (!clientId) return null;
  return await ctx.db.get(clientId);
}

export async function getProductTierForQuantity(
  ctx: DbCtx,
  productId: Id<"products">,
  quantity: number
) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }

  const tiers = await ctx.db
    .query("pricingProductTiers")
    .withIndex("by_productId_minQty", (q) => q.eq("productId", productId))
    .collect();

  const orderedTiers = [...tiers].sort((a, b) => {
    if (a.minQty === b.minQty) {
      return (a.maxQty ?? Number.POSITIVE_INFINITY) - (b.maxQty ?? Number.POSITIVE_INFINITY);
    }
    return a.minQty - b.minQty;
  });

  let selected: Doc<"pricingProductTiers"> | null = null;
  for (const tier of orderedTiers) {
    if (!tier.active) continue;
    if (quantity < tier.minQty) continue;
    if (typeof tier.maxQty === "number" && quantity > tier.maxQty) continue;
    selected = tier;
  }

  return selected;
}

export async function getZoneMargin(
  ctx: DbCtx,
  args: {
    municipalityId?: string;
    stateId?: string;
    clientId?: Id<"clients">;
  }
) {
  const zoneMargin = await resolveZoneMarginRule(ctx, args);
  return zoneMargin?.marginAmount ?? 0;
}

async function resolveZoneMarginRule(
  ctx: DbCtx,
  args: {
    municipalityId?: string;
    stateId?: string;
    clientId?: Id<"clients">;
  }
) {
  const client = await getClientDoc(ctx, args.clientId);
  const municipalityId = args.municipalityId || client?.municipalityId || "";
  const stateId = args.stateId || client?.stateId || "";

  const candidateScopes: Array<[Doc<"pricingZoneMargins">["scopeType"], string]> = [];

  if (client?._id) candidateScopes.push(["client", String(client._id)]);
  if (municipalityId) candidateScopes.push(["municipality", municipalityId]);
  if (stateId) candidateScopes.push(["state", stateId]);

  for (const [scopeType, scopeKey] of candidateScopes) {
    const margin = await ctx.db
      .query("pricingZoneMargins")
      .withIndex("by_scopeType_scopeKey", (q) =>
        q.eq("scopeType", scopeType).eq("scopeKey", scopeKey)
      )
      .first();

    if (margin?.active) {
      return margin;
    }
  }

  return null;
}

export async function getCustomerLevelDiscount(ctx: DbCtx, clientId?: Id<"clients">) {
  const level = await resolveCustomerLevelRule(ctx, clientId);
  return level ? normalizeDiscountPct(level.discountPct) : 0;
}

async function resolveCustomerLevelRule(ctx: DbCtx, clientId?: Id<"clients">) {
  const client = await getClientDoc(ctx, clientId);
  if (!client?.pricingCustomerLevelId) return null;

  const level = await ctx.db.get(client.pricingCustomerLevelId);
  if (!level || !level.active) return null;

  return level;
}

export async function resolveCustomerLevelByMonthlyAmount(
  ctx: DbCtx,
  args: {
    clientType: ClientType;
    monthlyAmount: number;
  }
) {
  const levels = await ctx.db.query("pricingCustomerLevels").collect();
  const code = getFixedLevelCodeForMonthlyAmount({
    clientType: args.clientType,
    monthlyAmount: args.monthlyAmount,
    levels,
  });
  return levels.find((level) => level.code.trim().toUpperCase() === code) || null;
}

export async function calculateDynamicPrice(
  ctx: DbCtx,
  args: CalculateDynamicPriceArgs
): Promise<PricingResult> {
  if (!Number.isFinite(args.quantity) || args.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }

  const product = await ctx.db.get(args.productId);
  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  const productTier = await getProductTierForQuantity(ctx, args.productId, args.quantity);
  const zoneMarginRule = await resolveZoneMarginRule(ctx, {
    clientId: args.clientId,
    municipalityId: args.municipality?.municipalityId,
    stateId: args.municipality?.stateId,
  });
  const customerLevelRule = await resolveCustomerLevelRule(ctx, args.clientId);
  const pricingSettings = await loadPricingSettings(ctx);
  const zoneMargin = zoneMarginRule ? normalizeMoney(zoneMarginRule.marginAmount) : 0;
  const discountPct = customerLevelRule ? normalizeDiscountPct(customerLevelRule.discountPct) : 0;

  const legacyFrontendPrice = normalizeMoney(args.legacyUnitPrice);
  const legacyLista1Price = parseLegacyPrice((product as Record<string, unknown>).lista1);

  const hasCompleteDynamicRules =
    Boolean(productTier) && Boolean(zoneMarginRule) && Boolean(customerLevelRule);
  const canUseDynamicPricing = pricingSettings.dynamicPricingEnabled && hasCompleteDynamicRules;

  const legacyPriceSource = legacyFrontendPrice > 0
    ? "legacy_frontend"
    : legacyLista1Price > 0
      ? "legacy_lista1"
      : "legacy_default";

  if (!canUseDynamicPricing) {
    if (!pricingSettings.legacyFallbackEnabled) {
      throw new Error("No hay regla de precio dinámica aplicable y el fallback legacy está desactivado.");
    }

    const basePrice = legacyFrontendPrice > 0 ? legacyFrontendPrice : legacyLista1Price;
    const finalPrice = Math.max(0, basePrice);
    return {
      basePrice,
      zoneMargin: 0,
      discountPct: 0,
      finalPrice,
      pricingSource: legacyPriceSource,
      pricingRuleVersion: 0,
    };
  }

  const basePrice = productTier?.basePrice ?? 0;
  const pricingSource: PricingSource = "dynamic";

  const finalPrice = Math.max(0, (basePrice + zoneMargin) * (1 - discountPct));
  const pricingRuleVersion = Math.max(
    productTier?.ruleVersion ?? 0,
    zoneMarginRule?.ruleVersion ?? 0,
    customerLevelRule?.ruleVersion ?? 0
  );

  return {
    basePrice,
    zoneMargin,
    discountPct,
    finalPrice,
    pricingSource,
    pricingRuleVersion,
  };
}
