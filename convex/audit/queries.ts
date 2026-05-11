import { query } from "../_generated/server";

const ALLOWED_ROLE_NAMES = new Set(["Administrador", "Vendedor", "Bodeguero"]);

export const runReadinessAudit = query({
  args: {},
  handler: async (ctx) => {
    const [
      users,
      roles,
      clients,
      suppliers,
      purchases,
      purchaseItems,
      supplierTransactions,
      inventory,
      inventoryLogs,
      routes,
      assets,
      vehicles,
      products,
      profiles,
      bodegas,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("roles").collect(),
      ctx.db.query("clients").collect(),
      ctx.db.query("suppliers").collect(),
      ctx.db.query("purchases").collect(),
      ctx.db.query("purchase_items").collect(),
      ctx.db.query("supplierTransactions").collect(),
      ctx.db.query("inventory").collect(),
      ctx.db.query("inventoryLogs").collect(),
      ctx.db.query("routes").collect(),
      ctx.db.query("assets").collect(),
      ctx.db.query("vehicles").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("profiles").collect(),
      ctx.db.query("bodegas").collect(),
    ]);

    const roleById = new Map(roles.map((r) => [r._id, r]));
    const supplierById = new Map(suppliers.map((s) => [s._id, s]));
    const purchaseById = new Map(purchases.map((p) => [p._id, p]));
    const productById = new Map(products.map((p) => [p._id, p]));
    const bodegaById = new Map(bodegas.map((b) => [b._id, b]));
    const assetById = new Map(assets.map((a) => [a._id, a]));
    const profileById = new Map(profiles.map((p) => [p._id, p]));

    const usersWithoutValidRole = users
      .filter((u) => {
        if (!u.roleId) return true;
        const role = roleById.get(u.roleId);
        if (!role) return true;
        return !ALLOWED_ROLE_NAMES.has(role.name);
      })
      .map((u) => ({ id: u._id, email: u.email, role: u.role, roleId: u.roleId }));

    const usersWithoutProfile = users
      .filter((u) => !u.profileId)
      .map((u) => ({ id: u._id, email: u.email, role: u.role }));

    const clientsWithoutFullLocation = clients
      .filter(
        (c) =>
          !c.stateId ||
          !c.stateName ||
          !c.municipalityId ||
          !c.municipalityName ||
          !c.townId ||
          !c.townName
      )
      .map((c) => ({
        id: c._id,
        commercialName: c.commercialName,
        stateId: c.stateId,
        municipalityId: c.municipalityId,
        townId: c.townId,
      }));

    const purchasesWithBrokenSupplier = purchases
      .filter((p) => !supplierById.has(p.supplierId))
      .map((p) => ({ id: p._id, supplierId: p.supplierId, folio: p.folio }));

    const orphanPurchaseItems = purchaseItems
      .filter((item) => !purchaseById.has(item.purchaseId))
      .map((item) => ({ id: item._id, purchaseId: item.purchaseId, productId: item.productId }));

    const purchaseItemsWithBrokenProduct = purchaseItems
      .filter((item) => !productById.has(item.productId))
      .map((item) => ({ id: item._id, purchaseId: item.purchaseId, productId: item.productId }));

    const orphanSupplierTransactions = supplierTransactions
      .filter((tx) => !supplierById.has(tx.supplierId))
      .map((tx) => ({ id: tx._id, supplierId: tx.supplierId, referenceId: tx.referenceId }));

    const transactionsWithBrokenReference = supplierTransactions
      .filter((tx) => tx.referenceId && !purchaseById.has(tx.referenceId as never))
      .map((tx) => ({ id: tx._id, supplierId: tx.supplierId, referenceId: tx.referenceId }));

    const inventoryWithBrokenRefs = inventory
      .filter((row) => !productById.has(row.productId) || !bodegaById.has(row.bodegaId))
      .map((row) => ({
        id: row._id,
        productId: row.productId,
        bodegaId: row.bodegaId,
        quantity: row.quantity,
      }));

    const inventoryLogsWithBrokenRefs = inventoryLogs
      .filter((row) => !productById.has(row.productId) || !bodegaById.has(row.bodegaId))
      .map((row) => ({
        id: row._id,
        productId: row.productId,
        bodegaId: row.bodegaId,
        referenceId: row.referenceId,
      }));

    const routesWithoutValidAssignee = routes
      .filter((r) => !profileById.has(r.assignedProfileId))
      .map((r) => ({ id: r._id, name: r.name, assignedProfileId: r.assignedProfileId }));

    const routesWithoutValidTransport = routes
      .filter((r) => !r.assetId && !r.vehicleId)
      .map((r) => ({ id: r._id, name: r.name }));

    const routesWithBrokenAsset = routes
      .filter((r) => r.assetId && !assetById.has(r.assetId))
      .map((r) => ({ id: r._id, name: r.name, assetId: r.assetId }));

    const routesUsingLegacyVehicleString = routes
      .filter((r) => !!r.vehicleId)
      .map((r) => ({ id: r._id, name: r.name, vehicleId: r.vehicleId }));

    const productWithLegacyCategoryStrings = products
      .filter((p) => typeof p.categoria === "string" || typeof p.subcategoria === "string")
      .map((p) => ({ id: p._id, sku: p.sku, categoria: p.categoria, subcategoria: p.subcategoria }));

    const supplierBalanceByTransactions = new Map<string, number>();
    for (const tx of supplierTransactions) {
      const key = String(tx.supplierId);
      const prev = supplierBalanceByTransactions.get(key) || 0;
      const next = prev + (tx.type === "Cargo" ? tx.amount : -tx.amount);
      supplierBalanceByTransactions.set(key, next);
    }

    const suppliersWithInconsistentBalance = suppliers
      .filter((s) => (s.currentBalance || 0) !== (supplierBalanceByTransactions.get(String(s._id)) || 0))
      .map((s) => ({
        id: s._id,
        businessName: s.businessName,
        currentBalance: s.currentBalance || 0,
        computedBalance: supplierBalanceByTransactions.get(String(s._id)) || 0,
      }));

    const inventorySumByProduct = new Map<string, number>();
    for (const row of inventory) {
      const key = String(row.productId);
      inventorySumByProduct.set(key, (inventorySumByProduct.get(key) || 0) + row.quantity);
    }
    const productsWithInconsistentStock = products
      .filter((p) => (p.stock || 0) !== (inventorySumByProduct.get(String(p._id)) || 0))
      .map((p) => ({
        id: p._id,
        sku: p.sku,
        stock: p.stock || 0,
        inventoryTotal: inventorySumByProduct.get(String(p._id)) || 0,
      }));

    return {
      summary: {
        users: users.length,
        roles: roles.length,
        clients: clients.length,
        suppliers: suppliers.length,
        purchases: purchases.length,
        purchaseItems: purchaseItems.length,
        supplierTransactions: supplierTransactions.length,
        inventory: inventory.length,
        inventoryLogs: inventoryLogs.length,
        routes: routes.length,
        products: products.length,
        vehicles: vehicles.length,
      },
      findings: {
        usersWithoutValidRole,
        usersWithoutProfile,
        clientsWithoutFullLocation,
        purchasesWithBrokenSupplier,
        orphanPurchaseItems,
        purchaseItemsWithBrokenProduct,
        orphanSupplierTransactions,
        transactionsWithBrokenReference,
        inventoryWithBrokenRefs,
        inventoryLogsWithBrokenRefs,
        routesWithoutValidAssignee,
        routesWithoutValidTransport,
        routesWithBrokenAsset,
        routesUsingLegacyVehicleString,
        suppliersWithInconsistentBalance,
        productsWithInconsistentStock,
        productWithLegacyCategoryStrings,
      },
    };
  },
});
