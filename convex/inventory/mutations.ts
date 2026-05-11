import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireIdentity } from "../common/utils";

export const adjust = mutation({
  args: {
    bodegaId: v.id("bodegas"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(), // The difference (negative if loss, positive if gain)
      newStock: v.number(), // The final stock count entered by user
      reason: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    for (const item of args.items) {
      // 1. Update/Create Inventory record for the specific bodega
      const existingInventory = await ctx.db
        .query("inventory")
        .withIndex("by_product_bodega", (q) =>
          q.eq("productId", item.productId).eq("bodegaId", args.bodegaId)
        )
        .unique();

      if (existingInventory) {
        await ctx.db.patch(existingInventory._id, {
          quantity: item.newStock,
        });
      } else {
        await ctx.db.insert("inventory", {
          bodegaId: args.bodegaId,
          productId: item.productId,
          quantity: item.newStock,
        });
      }

      // 2. Update Global Product Stock
      // We calculate the global change based on the difference 'item.quantity'
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: (product.stock || 0) + item.quantity,
        });
      }

      // 3. Create Log entry
      await ctx.db.insert("inventoryLogs", {
        productId: item.productId,
        bodegaId: args.bodegaId,
        previousStock: existingInventory?.quantity || 0,
        quantity: item.quantity,
        type: "ajuste",
        newStock: item.newStock,
        reason: `${item.reason}${args.notes ? ` | ${args.notes}` : ""}`,
        date: new Date().toISOString(),
      });
    }
  },
});
