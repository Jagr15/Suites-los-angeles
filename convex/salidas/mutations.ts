import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { salidaFields } from "./schema";
import { requireIdentity, requirePermission } from "../common/utils";

export const create = mutation({
  args: salidaFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requirePermission(
      ctx,
      "warehouse_outputs:allow_create",
      "Acceso denegado: no puedes crear salidas de bodega."
    );
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
    await requirePermission(
      ctx,
      "warehouse_outputs:edit_status",
      "Acceso denegado: no puedes editar salidas de bodega."
    );
    await ctx.db.patch(id, args);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("salidas") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    await ctx.db.delete(id);
  },
});
