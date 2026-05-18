import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, isAdmin, requireIdentity, requirePermission } from "../common/utils";
import { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

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

async function getCurrentUserByEmail(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  if (!email) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
}

async function getRouteIdsForUser(
  ctx: MutationCtx,
  user: { _id: Id<"users">; profileId?: Id<"profiles"> }
): Promise<Set<Id<"routes">>> {
  const routesByUser = await ctx.db
    .query("routes")
    .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", user._id))
    .collect();
  const routesByProfile = user.profileId
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", user.profileId))
        .collect()
    : [];
  return new Set([...routesByUser, ...routesByProfile].map((r) => r._id));
}

async function assertCustomerOwnershipIfRestricted(
  ctx: MutationCtx,
  client: { assignedRouteId?: Id<"routes"> }
) {
  if (await isAdmin(ctx)) return;
  const restrictToOwnCustomers = await hasPermission(ctx, "customers:restrict_view_other_salesmen");
  if (!restrictToOwnCustomers) return;
  const user = await getCurrentUserByEmail(ctx);
  if (!user) throw new Error("Acceso denegado: usuario no identificado para restricción de clientes.");
  const allowedRouteIds = await getRouteIdsForUser(ctx, user);
  if (!client.assignedRouteId || !allowedRouteIds.has(client.assignedRouteId)) {
    throw new Error("Acceso denegado: no puedes modificar clientes de otros vendedores.");
  }
}

/**
 * Crea un nuevo cliente.
 */
export const create = mutation({
  args: clientFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "customers:allow_create",
      "Acceso denegado: no puedes crear clientes."
    );
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
    const current = await ctx.db.get(args.id);
    if (!current) throw new Error("Cliente no encontrado");
    await assertCustomerOwnershipIfRestricted(ctx, current);

    if (!(await isAdmin(ctx))) {
      const gpsChanged =
        (current.mapsUrl || "") !== (args.mapsUrl || "") ||
        (current.lat ?? null) !== (args.lat ?? null) ||
        (current.lng ?? null) !== (args.lng ?? null);
      if (gpsChanged) {
        await requirePermission(
          ctx,
          "customers:allow_update_gps",
          "Acceso denegado: no puedes actualizar ubicación/GPS del cliente."
        );
      }

      if (current.creditLimit !== args.creditLimit) {
        await requirePermission(
          ctx,
          "customers:allow_credit_limit_assignment",
          "Acceso denegado: no puedes editar el límite de crédito."
        );
      }

      if (current.creditDays !== args.creditDays) {
        await requirePermission(
          ctx,
          "customers:allow_credit_terms_edit",
          "Acceso denegado: no puedes editar plazos de crédito."
        );
      }
    }

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
    const current = await ctx.db.get(args.id);
    if (!current) return;
    await assertCustomerOwnershipIfRestricted(ctx, current);
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const hasDeleteRestriction = await hasPermission(ctx, "records:restrict_delete");
      if (hasDeleteRestriction) {
        throw new Error("Acceso denegado: tu rol no permite eliminar registros.");
      }
    }
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
