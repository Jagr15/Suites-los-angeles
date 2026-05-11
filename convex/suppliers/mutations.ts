import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { supplierFields } from "./schema";

/**
 * Crea un nuevo proveedor.
 */
export const create = mutation({
  args: supplierFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", args);
  },
});

/**
 * Actualiza un proveedor existente.
 */
export const update = mutation({
  args: {
    id: v.id("suppliers"),
    ...supplierFields,
  },
  handler: async (ctx, { id, ...args }) => {
    await ctx.db.patch(id, args);
    return id;
  },
});

/**
 * Elimina un proveedor.
 */
export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
