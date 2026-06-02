import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { salidaFields } from "./schema";
import { hasPermission, isAdmin, isSuperAdmin, requireIdentity, requirePermission, requireWarehouseAccess } from "../common/utils";
import { getNextWarehouseMovementFolio } from "../common/warehouseFolios";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { calculateDynamicPrice } from "../pricing/service";

type ClientContext = {
  client: Doc<"clients">;
  snapshot: {
    clientId: Id<"clients">;
    clienteCodigo: string;
    clienteNombre: string;
  };
};

type SaleItemInput = Record<string, unknown>;
type PricedSaleItem = {
  productId: Id<"products">;
  quantity: number;
  price: number;
  subtotal: number;
  basePrice: number;
  zoneMargin: number;
  discountPct: number;
  finalPrice: number;
  pricingSource: string;
  pricingRuleVersion: number;
  sku?: string;
  descripcion?: string;
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveClientContext(ctx: MutationCtx, clientId: Id<"clients">): Promise<ClientContext> {
  const client = await ctx.db.get(clientId);
  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  return {
    client,
    snapshot: {
      clientId,
      clienteCodigo: String(client._id),
      clienteNombre: client.commercialName?.trim() || client.buyerName?.trim() || "Sin nombre",
    },
  };
}

function normalizeSaleItem(item: SaleItemInput) {
  const productId = item.productId || item.id;
  const quantity = toNumber(item.quantity ?? item.cantidad);
  const legacyPrice = toNumber(item.price ?? item.precio);

  if (!productId) {
    throw new Error("Cada item debe incluir un producto.");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }

  return {
    productId: productId as Id<"products">,
    quantity,
    legacyPrice,
    sku: typeof item.sku === "string" ? item.sku : undefined,
    descripcion: typeof item.descripcion === "string" ? item.descripcion : undefined,
  };
}

async function buildPricedItems(
  ctx: MutationCtx,
  items: SaleItemInput[],
  args: {
    clientId?: Id<"clients">;
    municipality?: {
      municipalityId?: string;
      stateId?: string;
    };
  }
) {
  const pricedItems: PricedSaleItem[] = [];

  for (const item of items) {
    const normalized = normalizeSaleItem(item);
    const product = await ctx.db.get(normalized.productId);
    const pricing = await calculateDynamicPrice(ctx, {
      productId: normalized.productId,
      quantity: normalized.quantity,
      clientId: args.clientId,
      municipality: args.municipality,
      legacyUnitPrice: normalized.legacyPrice,
    });

    pricedItems.push({
      productId: normalized.productId,
      quantity: normalized.quantity,
      price: pricing.finalPrice,
      subtotal: pricing.finalPrice * normalized.quantity,
      basePrice: pricing.basePrice,
      zoneMargin: pricing.zoneMargin,
      discountPct: pricing.discountPct,
      finalPrice: pricing.finalPrice,
      pricingSource: pricing.pricingSource,
      pricingRuleVersion: pricing.pricingRuleVersion,
      sku: normalized.sku || product?.sku,
      descripcion: normalized.descripcion || product?.producto,
    });
  }

  return pricedItems;
}

function sumItemsTotal(items: Array<{ subtotal: number }>) {
  return items.reduce((acc, item) => acc + toNumber(item.subtotal), 0);
}

export const create = mutation({
  args: {
    ...salidaFields,
    bodegaId: v.id("bodegas"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "warehouse_outputs:allow_create",
      "Acceso denegado: no puedes crear salidas de bodega."
    );
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const canAssignResponsible = await hasPermission(ctx, [
        "warehouse_outputs:allow_edit_assigned_outputs",
        "warehouse_outputs:assign_route_responsible",
      ]);
      const normalizedResponsible = (args.responsable || "").trim().toLowerCase();
      if (!canAssignResponsible && normalizedResponsible !== "" && normalizedResponsible !== "sin asignar") {
        throw new Error("Acceso denegado: no puedes asignar responsable/ruta en salidas.");
      }
    }
    await requireWarehouseAccess(ctx, args.bodegaId);
    const generatedFolio = await getNextWarehouseMovementFolio(ctx, args.bodegaId, "salida");
    const nextNumeroSalida = (args.numeroSalida || "").includes("-") ? args.numeroSalida : generatedFolio.folio;
    const { client, snapshot } = await resolveClientContext(ctx, args.clientId);
    const pricedItems = await buildPricedItems(ctx, args.items as SaleItemInput[], {
      clientId: client._id,
      municipality: {
        municipalityId: client.municipalityId,
        stateId: client.stateId,
      },
    });
    const totalAmount = sumItemsTotal(pricedItems);
    const existingNumber = await ctx.db
      .query("salidas")
      .withIndex("by_numeroSalida", (q) => q.eq("numeroSalida", nextNumeroSalida))
      .unique();
    if (existingNumber) throw new Error("El folio de salida ya existe.");
    const id = await ctx.db.insert("salidas", {
      ...args,
      ...snapshot,
      items: pricedItems,
      totalAmount,
      numeroSalida: nextNumeroSalida,
      folioNumber: generatedFolio.folioNumber,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("salidas"),
    ...salidaFields,
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, { id, ...args }) => {
    await requireIdentity(ctx);
    const current = await ctx.db.get(id);
    if (!current) throw new Error("Salida no encontrada");
    if (current.bodegaId) {
      await requireWarehouseAccess(ctx, current.bodegaId);
    } else if (!(await isAdmin(ctx))) {
      throw new Error("Acceso denegado: la salida legacy no está ligada a una bodega.");
    }
    if (args.bodegaId) {
      await requireWarehouseAccess(ctx, args.bodegaId);
    }

    if (current.status !== args.status) {
      await requirePermission(
        ctx,
        "warehouse_outputs:edit_status",
        "Acceso denegado: no puedes editar estado de salidas de bodega."
      );
    }

    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const canAssignResponsible = await hasPermission(ctx, [
        "warehouse_outputs:allow_edit_assigned_outputs",
        "warehouse_outputs:assign_route_responsible",
      ]);
      const responsibleChanged = current.responsable !== args.responsable;
      const routeChanged = (current.ruta || "") !== (args.ruta || "");
      const destinationChanged = (current.destino || "") !== (args.destino || "");
      const agentChanged = (current.agente || "") !== (args.agente || "");
      if (!canAssignResponsible && (responsibleChanged || routeChanged || destinationChanged || agentChanged)) {
        throw new Error("Acceso denegado: no puedes asignar o cambiar responsable/ruta/carga.");
      }
    }

    const superAdmin = await isSuperAdmin(ctx);
    const nextNumeroSalida = superAdmin ? args.numeroSalida : current.numeroSalida;
    const nextClientId = args.clientId ?? current.clientId;
    const clientContext = nextClientId ? await resolveClientContext(ctx, nextClientId) : null;
    const pricedItems = await buildPricedItems(ctx, args.items as SaleItemInput[], {
      clientId: clientContext?.client._id,
      municipality: clientContext?.client
        ? {
            municipalityId: clientContext.client.municipalityId,
            stateId: clientContext.client.stateId,
          }
        : undefined,
    });
    const totalAmount = sumItemsTotal(pricedItems);

    await ctx.db.patch(id, {
      ...args,
      ...(clientContext?.snapshot || {}),
      items: pricedItems,
      totalAmount,
      numeroSalida: nextNumeroSalida,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("salidas") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }
    const current = await ctx.db.get(id);
    if (current) {
      if (current.bodegaId) {
        await requireWarehouseAccess(ctx, current.bodegaId);
      } else if (!isAdministrator) {
        throw new Error("Acceso denegado: la salida legacy no está ligada a una bodega.");
      }
    }
    await ctx.db.delete(id);
  },
});

export const reserveFolio = mutation({
  args: { bodegaId: v.id("bodegas") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requireWarehouseAccess(ctx, args.bodegaId);
    const nextFolio = await getNextWarehouseMovementFolio(ctx, args.bodegaId, "salida");
    return { numeroSalida: nextFolio.folio, folioNumber: nextFolio.folioNumber };
  },
});
