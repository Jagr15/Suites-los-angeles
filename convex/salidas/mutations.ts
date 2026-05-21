import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { salidaFields } from "./schema";
import { hasPermission, isAdmin, isSuperAdmin, requireIdentity, requirePermission } from "../common/utils";
import type { MutationCtx } from "../_generated/server";

async function getNextSalidaNumber(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("sequences")
    .withIndex("by_key", (q) => q.eq("key", "salida_folio"))
    .unique();

  if (existing) {
    const next = existing.value + 1;
    await ctx.db.patch(existing._id, { value: next });
    return `SAL-${String(next).padStart(5, "0")}`;
  }

  const salidas = await ctx.db.query("salidas").collect();
  let maxLegacy = 0;
  for (const salida of salidas) {
    const parsed = Number((salida.numeroSalida || "").match(/SAL-(\d+)/i)?.[1] || 0);
    if (Number.isFinite(parsed) && parsed > maxLegacy) {
      maxLegacy = parsed;
    }
  }

  const next = maxLegacy + 1;
  await ctx.db.insert("sequences", { key: "salida_folio", value: next });
  return `SAL-${String(next).padStart(5, "0")}`;
}

export const create = mutation({
  args: salidaFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "warehouse_outputs:allow_create",
      "Acceso denegado: no puedes crear salidas de bodega."
    );
    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const canAssignResponsible = await hasPermission(ctx, "warehouse_outputs:assign_route_responsible");
      const normalizedResponsible = (args.responsable || "").trim().toLowerCase();
      if (!canAssignResponsible && normalizedResponsible !== "" && normalizedResponsible !== "sin asignar") {
        throw new Error("Acceso denegado: no puedes asignar responsable/ruta en salidas.");
      }
    }
    const generatedNumeroSalida = await getNextSalidaNumber(ctx);
    const id = await ctx.db.insert("salidas", {
      ...args,
      numeroSalida: generatedNumeroSalida,
    });
    
    // Opcional: Descontar del inventario si es una carga/salida real
    for (const item of args.items) {
      // Intentar encontrar el producto en el almacén especificado
      // Nota: args.almacen es un string en el schema que creamos, 
      // pero debería ser un ID si queremos vincularlo a la tabla bodegas.
      // Por ahora mantenemos la compatibilidad con lo que envía el formulario.
    }
    
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("salidas"),
    ...salidaFields,
  },
  handler: async (ctx, { id, ...args }) => {
    await requireIdentity(ctx);
    const current = await ctx.db.get(id);
    if (!current) throw new Error("Salida no encontrada");

    if (current.status !== args.status) {
      await requirePermission(
        ctx,
        "warehouse_outputs:edit_status",
        "Acceso denegado: no puedes editar estado de salidas de bodega."
      );
    }

    const isAdministrator = await isAdmin(ctx);
    if (!isAdministrator) {
      const canAssignResponsible = await hasPermission(ctx, "warehouse_outputs:assign_route_responsible");
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

    await ctx.db.patch(id, {
      ...args,
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
    await ctx.db.delete(id);
  },
});
