import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./common/utils";

function assertDebugToolsEnabled() {
  if (process.env.DEBUG_TOOLS_ENABLED !== "true") {
    throw new Error("Debug tools are disabled");
  }
}

export const listAuthData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    assertDebugToolsEnabled();
    const accounts = await ctx.db.query("authAccounts").collect();
    const sessions = await ctx.db.query("authSessions").collect();
    const users = await ctx.db.query("users").collect();
    return { accounts, sessions, users };
  },
});

export const cleanupOrphans = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    assertDebugToolsEnabled();
    const accounts = await ctx.db.query("authAccounts").collect();
    const users = await ctx.db.query("users").collect();
    const userIds = new Set(users.map(u => u._id));
    
    let deletedCount = 0;
    for (const account of accounts) {
      if (!userIds.has(account.userId)) {
        await ctx.db.delete(account._id);
        deletedCount++;
      }
    }
    
    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      if (!userIds.has(session.userId)) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }
    
    return { deletedCount };
  },
});

export const listBodegas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bodegas").collect();
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});

export const listInventory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventory").collect();
  },
});

export const listAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bodega_categorias").collect();
  },
});

export const getImportStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const inventory = await ctx.db.query("inventory").collect();
    const pricingProductTiers = await ctx.db.query("pricingProductTiers").collect();
    
    // Find pricing tiers that are imported from Excel
    const importedTiers = pricingProductTiers.filter(t => t.notes === "Importado desde Excel");
    const importedProductIds = new Set(importedTiers.map(t => String(t.productId)));
    const importedProductsList = products.filter(p => importedProductIds.has(String(p._id)));

    // Get sample of 5 imported products with their inventory and pricing
    const samples = [];
    for (let i = 0; i < Math.min(5, importedProductsList.length); i++) {
      const p = importedProductsList[i];
      const invs = inventory.filter(inv => inv.productId === p._id);
      const tiers = importedTiers.filter(t => t.productId === p._id);
      samples.push({
        product: {
          _id: p._id,
          name: p.producto,
          sku: p.codigo,
          cost: p.lista1,
          venta: p.lista11,
        },
        inventory: invs.map(inv => ({
          bodegaId: inv.bodegaId,
          quantity: inv.quantity,
        })),
        pricingTiers: tiers.map(t => ({
          minQty: t.minQty,
          maxQty: t.maxQty,
          price: t.basePrice,
        })),
      });
    }

    return {
      totalProductsInDb: products.length,
      totalImportedProducts: importedProductsList.length,
      totalInventoryEntries: inventory.length,
      totalProductPricingTiers: pricingProductTiers.length,
      totalImportedPricingTiers: importedTiers.length,
      samples,
    };
  },
});






