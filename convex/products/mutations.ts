import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { productFields } from "./schema";
import { requireIdentity } from "../common/utils";

export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    sku: v.optional(v.string()),
    codigo: v.optional(v.string()),
    producto: v.optional(v.string()),
    cantidadEmpaque: v.optional(v.string()),
    categoria: v.optional(v.string()),
    subcategoria: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Activo"), v.literal("Inactivo"))),
    lista1: v.optional(v.string()),
    lista2: v.optional(v.string()),
    lista3: v.optional(v.string()),
    lista4: v.optional(v.string()),
    lista5: v.optional(v.string()),
    lista6: v.optional(v.string()),
    lista7: v.optional(v.string()),
    lista8: v.optional(v.string()),
    lista9: v.optional(v.string()),
    lista10: v.optional(v.string()),
    lista11: v.optional(v.string()),
    lista12: v.optional(v.string()),
    lista13: v.optional(v.string()),
    lista14: v.optional(v.string()),
    lista15: v.optional(v.string()),
    stock: v.optional(v.number()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields as any);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await ctx.db.delete(args.id);
  },
});

export const bulkUpsert = mutation({
  args: {
    items: v.array(v.object(productFields)),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    let created = 0;
    let updated = 0;

    for (const item of args.items) {
      // Usamos el SKU como llave única para identificar productos existentes
      const existing = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", item.sku))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, item);
        updated++;
      } else {
        await ctx.db.insert("products", item);
        created++;
      }
    }
    return { created, updated };
  },
});
