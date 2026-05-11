import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("product_categories").collect();
  },
});

export const listSubcategories = query({
  args: { categoryId: v.optional(v.id("product_categories")) },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      return await ctx.db
        .query("product_subcategories")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
    }
    return await ctx.db.query("product_subcategories").collect();
  },
});

export const createCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("product_categories", { name: args.name });
  },
});

export const createSubcategory = mutation({
  args: { name: v.string(), categoryId: v.id("product_categories") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("product_subcategories", {
      name: args.name,
      categoryId: args.categoryId,
    });
  },
});

export const removeCategory = mutation({
  args: { id: v.id("product_categories") },
  handler: async (ctx, args) => {
    const subcategories = await ctx.db
      .query("product_subcategories")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();
    
    for (const sub of subcategories) {
      await ctx.db.delete(sub._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const removeSubcategory = mutation({
  args: { id: v.id("product_subcategories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
