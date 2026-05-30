import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { salidaFields } from "./schema";
import { hasPermission, isAdmin, isSuperAdmin, requireIdentity, requirePermission, requireWarehouseAccess } from "../common/utils";
import { getNextWarehouseMovementFolio } from "../common/warehouseFolios";

export const create = mutation({
  args: {
    ...salidaFields,
    bodegaId: v.id("bodegas"),
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
    const existingNumber = await ctx.db
      .query("salidas")
      .withIndex("by_numeroSalida", (q) => q.eq("numeroSalida", nextNumeroSalida))
      .unique();
    if (existingNumber) throw new Error("El folio de salida ya existe.");
    const id = await ctx.db.insert("salidas", {
      ...args,
      numeroSalida: nextNumeroSalida,
      folioNumber: generatedFolio.folioNumber,
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
