import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { salidaFields } from "./schema";
import { hasPermission, isAdmin, requireIdentity, requirePermission } from "../common/utils";

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
    const id = await ctx.db.insert("salidas", args);
    
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

    await ctx.db.patch(id, args);
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
