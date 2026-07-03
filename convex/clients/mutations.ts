import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, isAdmin, requireIdentity, requirePermission, resolveCurrentStaffUser } from "../common/utils";
import { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  ensureFixedCustomerLevels,
  getFixedCustomerLevelId,
} from "../pricing/customer_levels";

const clientFields = {
  clientType: v.optional(v.union(v.literal("commercial"), v.literal("wholesaler"), v.literal("retail"), v.literal("QA"))),
  commercialName: v.string(),
  buyerName: v.optional(v.string()),
  responsable: v.optional(v.string()),
  requiresInvoice: v.optional(v.boolean()),
  businessName: v.optional(v.string()),
  rfc: v.optional(v.string()),
  taxRegime: v.optional(v.string()),
  mapsUrl: v.optional(v.string()),
  townId: v.optional(v.string()),
  townName: v.optional(v.string()),
  municipalityId: v.optional(v.string()),
  municipalityName: v.optional(v.string()),
  pricingCustomerLevelId: v.optional(v.id("pricingCustomerLevels")),
  visitFrequency: v.optional(v.union(v.literal("Semanal"), v.literal("Quincenal"), v.literal("Mensual"))),
  tipoEntrega: v.optional(v.string()),
  diaEntrega: v.optional(v.string()),
  assignedRouteId: v.optional(v.id("routes")),
  assignedRouteName: v.optional(v.string()),
  creditLimit: v.optional(v.number()),
  creditDays: v.optional(v.number()),
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

type ClientMutationArgs = {
  clientType?: "commercial" | "wholesaler" | "retail" | "QA";
  commercialName: string;
  buyerName?: string;
  responsable?: string;
  requiresInvoice?: boolean;
  businessName?: string;
  rfc?: string;
  taxRegime?: string;
  mapsUrl?: string;
  townId?: string;
  townName?: string;
  municipalityId?: string;
  municipalityName?: string;
  pricingCustomerLevelId?: Id<"pricingCustomerLevels">;
  visitFrequency?: "Semanal" | "Quincenal" | "Mensual";
  tipoEntrega?: string;
  diaEntrega?: string;
  assignedRouteId?: Id<"routes">;
  assignedRouteName?: string;
  creditLimit?: number;
  creditDays?: number;
  availableScheduleStart?: string;
  availableScheduleEnd?: string;
  stateId?: string;
  stateName?: string;
  lat?: number;
  lng?: number;
  image?: string;
  visitOrder?: number;
};

type NormalizedClientPayload = {
  clientType: "commercial" | "wholesaler" | "retail" | "QA";
  commercialName: string;
  buyerName: string;
  responsable: string;
  requiresInvoice: boolean;
  businessName?: string;
  rfc?: string;
  taxRegime?: string;
  mapsUrl: string;
  townId: string;
  townName: string;
  municipalityId: string;
  municipalityName: string;
  pricingCustomerLevelId?: Id<"pricingCustomerLevels">;
  visitFrequency: "Semanal" | "Quincenal" | "Mensual";
  tipoEntrega?: "pickup" | "delivery" | "Ruta";
  diaEntrega?: string;
  assignedRouteId?: Id<"routes">;
  assignedRouteName?: string;
  creditLimit: number;
  creditDays: number;
  availableScheduleStart?: string;
  availableScheduleEnd?: string;
  stateId?: string;
  stateName?: string;
  lat?: number;
  lng?: number;
  image?: string;
  visitOrder?: number;
};

async function normalizeClientPayload(
  ctx: MutationCtx,
  args: ClientMutationArgs,
  existingAssignedRouteId?: Id<"routes">
): Promise<NormalizedClientPayload> {
  const clientType = args.clientType ?? "commercial";
  const isQA = clientType === "QA";
  const isRetail = clientType === "retail";
  const isWholesaler = clientType === "wholesaler";
  const commercialName = normalizeText(args.commercialName);
  const buyerName = isRetail
    ? commercialName
    : normalizeText(args.buyerName) || normalizeText(args.responsable) || normalizeText(commercialName);
  const responsible = normalizeText(args.responsable) || buyerName;
  const requiresInvoice = isRetail ? false : !!args.requiresInvoice;
  const mapsUrl = isRetail ? "" : normalizeText(args.mapsUrl);
  const townId = isRetail ? "" : normalizeText(args.townId);
  const townName = isRetail ? "" : normalizeText(args.townName);
  const municipalityId = isRetail ? "" : normalizeText(args.municipalityId);
  const municipalityName = isRetail ? "" : normalizeText(args.municipalityName);
  const stateId = isRetail ? "" : normalizeText(args.stateId);
  const stateName = isRetail ? "" : normalizeText(args.stateName);
  const visitFrequency = isRetail ? "Semanal" : (args.visitFrequency ?? "Semanal");
  const creditLimit = isRetail ? 0 : Number(args.creditLimit ?? 0);
  const creditDays = isRetail ? 0 : Number(args.creditDays ?? 0);
  const availableScheduleStart = isRetail ? undefined : args.availableScheduleStart;
  const availableScheduleEnd = isRetail ? undefined : args.availableScheduleEnd;
  const assignedRouteId = isRetail ? undefined : args.assignedRouteId;
  const assignedRouteName = isRetail ? undefined : args.assignedRouteName;
  const rawTipoEntrega = normalizeText(args.tipoEntrega);
  const tipoEntrega = isWholesaler
    ? (rawTipoEntrega === "delivery" ? "delivery" : "pickup")
    : undefined;
  const diaEntrega = isWholesaler ? normalizeText(args.diaEntrega) || "Lunes" : undefined;

  if (!isRetail && !isQA) {
    assertLocationConsistency({
      stateId,
      stateName,
      municipalityId,
      municipalityName,
      townId,
      townName,
    });
    if (!buyerName) throw new Error("El encargado es obligatorio.");
    if (!Number.isFinite(creditLimit)) throw new Error("El límite de crédito es inválido.");
    if (!Number.isFinite(creditDays)) throw new Error("Los días de crédito son inválidos.");
  }

  if (assignedRouteId) {
    const route = await ctx.db.get(assignedRouteId);
    if (!route) {
      throw new Error("La ruta asignada no existe.");
    }
    if (route.isActive === false && String(existingAssignedRouteId || "") !== String(assignedRouteId)) {
      throw new Error("No se puede asignar una ruta inactiva.");
    }
  }

  await ensureFixedCustomerLevels(ctx);
  const bronzeLevelId = await getFixedCustomerLevelId(ctx, "BRONCE");
  let levelId: Id<"pricingCustomerLevels"> | undefined;
  if (isRetail || isQA) {
      levelId = bronzeLevelId ?? undefined;
    } else {
      levelId = args.pricingCustomerLevelId;
  }

  if (!isRetail && !isQA && levelId) {
    const level = await ctx.db.get(levelId);
    if (!level) throw new Error("El nivel de precio seleccionado no existe.");
    const code = normalizeText(level.code).toUpperCase();
    const allowedCodes = clientType === "wholesaler"
      ? new Set(["BRONCE", "PLATA", "ORO", "DIAMANTE", "ULTRA"])
      : new Set(["BRONCE", "PLATA", "ORO", "DIAMANTE"]);
    if (!allowedCodes.has(code)) {
      throw new Error("El nivel seleccionado no es válido para este tipo de cliente.");
    }
  }

  return {
    clientType: isQA ? "commercial" : clientType,
    commercialName,
    buyerName,
    responsable: responsible,
    requiresInvoice,
    businessName: isRetail ? undefined : args.businessName,
    rfc: isRetail ? undefined : args.rfc,
    taxRegime: isRetail ? undefined : args.taxRegime,
    mapsUrl,
    townId,
    townName,
    municipalityId,
    municipalityName,
    pricingCustomerLevelId: levelId,
    visitFrequency,
    tipoEntrega,
    diaEntrega,
    assignedRouteId,
    assignedRouteName,
    creditLimit,
    creditDays,
    availableScheduleStart,
    availableScheduleEnd,
    stateId,
    stateName,
    lat: args.lat,
    lng: args.lng,
    image: args.image,
    visitOrder: args.visitOrder,
  };
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
    const data = await normalizeClientPayload(ctx, args);
    return await ctx.db.insert("clients", data);
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
    const data = await normalizeClientPayload(ctx, args, current.assignedRouteId);

    if (!(await isAdmin(ctx)) && data.clientType !== "retail") {
      const gpsChanged =
        (current.mapsUrl || "") !== (data.mapsUrl || "") ||
        (current.lat ?? null) !== (data.lat ?? null) ||
        (current.lng ?? null) !== (data.lng ?? null);
      if (gpsChanged) {
        await requirePermission(
          ctx,
          "customers:allow_update_gps",
          "Acceso denegado: no puedes actualizar ubicación/GPS del cliente."
        );
      }

      if (current.creditLimit !== data.creditLimit) {
        await requirePermission(
          ctx,
          "customers:allow_credit_limit_assignment",
          "Acceso denegado: no puedes editar el límite de crédito."
        );
      }

      if (current.creditDays !== data.creditDays) {
        await requirePermission(
          ctx,
          "customers:allow_credit_terms_edit",
          "Acceso denegado: no puedes editar plazos de crédito."
        );
      }
    }

    const { ...clientData } = data;
    await ctx.db.patch(args.id, clientData);
    return args.id;
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

export const updateGps = mutation({
  args: {
    id: v.id("clients"),
    lat: v.number(),
    lng: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveCurrentStaffUser(ctx);
    if (!currentUser.user) {
      throw new Error("No autenticado");
    }
    await requirePermission(
      ctx,
      "customers:allow_update_gps",
      "Acceso denegado: no puedes actualizar la ubicación del cliente."
    );

    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Cliente no encontrado");
    }

    await assertCustomerOwnershipIfRestricted(ctx, client);

    await ctx.db.patch(args.id, {
      lat: args.lat,
      lng: args.lng,
      mapsUrl: client.mapsUrl || `https://www.google.com/maps?q=${args.lat},${args.lng}`,
    });

    return args.id;
  },
});
