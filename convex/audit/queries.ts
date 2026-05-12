import { query } from "../_generated/server";

const ALLOWED_ROLE_NAMES = new Set(["SuperAdmin", "Admin", "Bodeguero", "Vendedor"]);

function normalizeLegacyRoleName(role?: string | null) {
  const normalized = (role || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "superadmin" || normalized === "super admin") return "SuperAdmin";
  if (normalized === "administrador" || normalized === "admin" || normalized === "finanzas") return "Admin";
  if (normalized === "bodega" || normalized === "bodeguero" || normalized === "rutas") return "Bodeguero";
  if (normalized === "vendedor" || normalized === "preventista") return "Vendedor";
  return null;
}

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
      authAccounts,
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
      ctx.db.query("authAccounts").collect(),
    ]);

    const roleById = new Map(roles.map((r) => [r._id, r]));
    const supplierById = new Map(suppliers.map((s) => [s._id, s]));
    const purchaseById = new Map(purchases.map((p) => [p._id, p]));
    const productById = new Map(products.map((p) => [p._id, p]));
    const bodegaById = new Map(bodegas.map((b) => [b._id, b]));
    const assetById = new Map(assets.map((a) => [a._id, a]));
    const profileById = new Map(profiles.map((p) => [p._id, p]));
    const userById = new Map(users.map((u) => [u._id, u]));

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

    const usersWithBrokenProfile = users
      .filter((u) => !!u.profileId && !profileById.has(u.profileId))
      .map((u) => ({ id: u._id, email: u.email, profileId: u.profileId }));

    const usersWithoutRoleId = users
      .filter((u) => !u.roleId)
      .map((u) => ({ id: u._id, email: u.email, role: u.role }));

    const usersWithRoleStringMismatch = users
      .filter((u) => !!u.roleId && !!u.role && roleById.get(u.roleId)?.name !== u.role)
      .map((u) => {
        const roleId = u.roleId!;
        return {
          id: u._id,
          email: u.email,
          roleString: u.role,
          roleId,
          roleIdName: roleById.get(roleId)?.name,
        };
      });

    const rolesWithEmptyPermissions = roles
      .filter((r) => !r.permissions || r.permissions.length === 0)
      .map((r) => ({ id: r._id, name: r.name }));

    const roleNameCount = new Map<string, number>();
    for (const role of roles) {
      roleNameCount.set(role.name, (roleNameCount.get(role.name) || 0) + 1);
    }
    const duplicateRoles = Array.from(roleNameCount.entries())
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    const orphanAuthAccounts = authAccounts
      .filter((a) => !userById.has(a.userId))
      .map((a) => ({
        id: a._id,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        userId: a.userId,
      }));

    const usersWithoutAuthAccount = users
      .filter((u) => !!u.email)
      .filter(
        (u) =>
          !authAccounts.some(
            (a) => a.userId === u._id || (a.provider === "password" && a.providerAccountId === u.email)
          )
      )
      .map((u) => ({ id: u._id, email: u.email }));

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

    const suppliersWithoutName = suppliers
      .filter((s) => !(s.businessName || "").trim())
      .map((s) => ({ id: s._id, businessName: s.businessName }));

    const vehiclesWithMissingBasics = vehicles
      .filter((v) => !(v.plate || "").trim())
      .map((v) => ({ id: v._id, plate: v.plate, model: v.model, brand: v.brand }));

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
        usersWithBrokenProfile,
        usersWithoutRoleId,
        usersWithRoleStringMismatch,
        usersWithoutAuthAccount,
        orphanAuthAccounts,
        duplicateRoles,
        rolesWithEmptyPermissions,
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
        suppliersWithoutName,
        productsWithInconsistentStock,
        productWithLegacyCategoryStrings,
        vehiclesWithMissingBasics,
      },
    };
  },
});

export const previewUserRoleNormalization = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    const users = await ctx.db.query("users").collect();
    const roleById = new Map(roles.map((r) => [r._id, r]));
    const operationalRoleByName = new Map(
      roles
        .filter((r) => ["SuperAdmin", "Admin", "Bodeguero", "Vendedor"].includes(r.name))
        .map((r) => [r.name, r])
    );

    const plan = users.map((user) => {
      const roleFromId = user.roleId ? roleById.get(user.roleId)?.name : undefined;
      const normalizedFromString = normalizeLegacyRoleName(user.role);
      const normalizedFromRoleId = normalizeLegacyRoleName(roleFromId);
      const targetRoleName = normalizedFromRoleId || normalizedFromString;
      const targetRole = targetRoleName ? operationalRoleByName.get(targetRoleName) : undefined;
      const supported = !!targetRole;
      const unchanged = supported && user.roleId === targetRole!._id && user.role === targetRole!.name;

      return {
        userId: user._id,
        email: user.email,
        currentRole: user.role,
        currentRoleId: user.roleId,
        currentRoleIdName: roleFromId,
        targetRole: targetRole?.name,
        targetRoleId: targetRole?._id,
        supported,
        action: !supported ? "manual_review" : unchanged ? "unchanged" : "update",
      };
    });

    return {
      totals: {
        users: users.length,
        update: plan.filter((p) => p.action === "update").length,
        unchanged: plan.filter((p) => p.action === "unchanged").length,
        manualReview: plan.filter((p) => p.action === "manual_review").length,
      },
      plan,
    };
  },
});

export const inspectRbacGaps = query({
  args: {},
  handler: async (ctx) => {
    const [users, roles, authAccounts, profiles] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("roles").collect(),
      ctx.db.query("authAccounts").collect(),
      ctx.db.query("profiles").collect(),
    ]);

    const roleById = new Map(roles.map((r) => [r._id, r]));
    const authByUserId = new Map<string, number>();
    for (const a of authAccounts) {
      const key = String(a.userId);
      authByUserId.set(key, (authByUserId.get(key) || 0) + 1);
    }
    const profileById = new Map(profiles.map((p) => [p._id, p]));

    const usersWithoutValidRole = users
      .filter((u) => {
        if (!u.roleId) return true;
        const role = roleById.get(u.roleId);
        if (!role) return true;
        return !ALLOWED_ROLE_NAMES.has(role.name);
      })
      .map((u) => {
        const role = u.roleId ? roleById.get(u.roleId) : null;
        return {
          userId: u._id,
          email: u.email,
          role: u.role,
          roleId: u.roleId,
          roleIdName: role?.name ?? null,
          profileId: u.profileId ?? null,
          profileExists: u.profileId ? profileById.has(u.profileId) : false,
          authAccounts: authByUserId.get(String(u._id)) || 0,
          reason: !u.roleId
            ? "missing_role_id"
            : !role
              ? "role_id_not_found"
              : "role_not_operational",
        };
      });

    const usersWithoutProfile = users
      .filter((u) => !u.profileId)
      .map((u) => ({
        userId: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        roleId: u.roleId ?? null,
        roleIdName: u.roleId ? roleById.get(u.roleId)?.name ?? null : null,
        authAccounts: authByUserId.get(String(u._id)) || 0,
      }));

    return {
      usersWithoutValidRole,
      usersWithoutProfile,
    };
  },
});

export const inspectUserProfileLink = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("profiles").collect();

    const usersWithoutProfile = users.filter((u) => !u.profileId);
    return usersWithoutProfile.map((u) => {
      const profilesByUserId = profiles.filter((p) => p.userId === u._id);
      const profilesByName = profiles.filter(
        (p) => (p.fullName || "").trim().toLowerCase() === (u.name || "").trim().toLowerCase()
      );
      return {
        userId: u._id,
        email: u.email,
        name: u.name,
        profileId: u.profileId ?? null,
        profilesByUserId: profilesByUserId.map((p) => ({ id: p._id, fullName: p.fullName })),
        profilesByName: profilesByName.map((p) => ({ id: p._id, fullName: p.fullName })),
      };
    });
  },
});
