import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "../common/utils";

const clientFields = {
  commercialName: v.string(),
  buyerName: v.string(),
  requiresInvoice: v.boolean(),
  businessName: v.optional(v.string()),
  rfc: v.optional(v.string()),
  taxRegime: v.optional(v.string()),
  mapsUrl: v.string(),
  townId: v.string(),
  townName: v.string(),
  municipalityId: v.string(),
  municipalityName: v.string(),
  visitFrequency: v.union(v.literal("Semanal"), v.literal("Quincenal"), v.literal("Mensual")),
  assignedRouteId: v.optional(v.id("routes")),
  assignedRouteName: v.optional(v.string()),
  creditLimit: v.number(),
  creditDays: v.number(),
  availableScheduleStart: v.optional(v.string()),
  availableScheduleEnd: v.optional(v.string()),
  stateId: v.optional(v.string()),
  stateName: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  image: v.optional(v.string()),
  visitOrder: v.optional(v.number()),
};

function normalizeText(value?: string) {
  return (value ?? "").trim();
}

function assertLocationConsistency(args: {
  stateId?: string;
  stateName?: string;
  municipalityId: string;
  municipalityName: string;
  townId: string;
  townName: string;
}) {
  const stateId = normalizeText(args.stateId);
  const stateName = normalizeText(args.stateName);
  const municipalityId = normalizeText(args.municipalityId);
  const municipalityName = normalizeText(args.municipalityName);
  const townId = normalizeText(args.townId);
  const townName = normalizeText(args.townName);

  if (!stateId || !stateName) {
    throw new Error("Debe seleccionar un estado válido.");
  }
  if (!municipalityId || !municipalityName) {
    throw new Error("Debe seleccionar un municipio válido.");
  }
  if (!townId || !townName) {
    throw new Error("Debe seleccionar una localidad válida.");
  }
}

/**
 * Crea un nuevo cliente.
 */
export const create = mutation({
  args: clientFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    assertLocationConsistency(args);
    return await ctx.db.insert("clients", args);
  },
});

/**
 * Actualiza la información de un cliente.
 */
export const update = mutation({
  args: {
    id: v.id("clients"),
    ...clientFields,
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    assertLocationConsistency(args);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Elimina un cliente.
 */
export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await ctx.db.delete(args.id);
  },
});
/**
 * Actualiza el orden de visita de una lista de clientes.
 */
export const updateVisitOrder = mutation({
  args: {
    orderedIds: v.array(v.id("clients")),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { visitOrder: i + 1 });
    }
  },
});
