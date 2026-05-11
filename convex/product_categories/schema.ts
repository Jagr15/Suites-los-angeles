import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productCategoriesTable = defineTable({
  name: v.string(),
}).index("by_name", ["name"]);

export const productSubcategoriesTable = defineTable({
  name: v.string(),
  categoryId: v.id("product_categories"),
}).index("by_category", ["categoryId"]);
