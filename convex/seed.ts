import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./common/hashing";

function requireProdBootstrapToken(token?: string) {
  const expected = process.env.BOOTSTRAP_ADMIN_TOKEN;
  if (!expected) {
    throw new Error("Missing BOOTSTRAP_ADMIN_TOKEN in Convex environment");
  }
  if (!token || token !== expected) {
    throw new Error("Invalid bootstrap token");
  }
}

function assertDevSeedEnabled() {
  if (process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Dev seed is disabled. Set ALLOW_DEV_SEED=true to enable.");
  }
}

/**
 * Función genérica para crear cualquier admin.
 */
export const createFirstAdmin = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    bootstrapToken: v.string(),
  },
  handler: async (ctx, args) => {
    requireProdBootstrapToken(args.bootstrapToken);

    let adminRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "Administrador"))
      .first();

    if (!adminRole) {
      const roleId = await ctx.db.insert("roles", {
        name: "Administrador",
        description: "Acceso administrativo total al panel.",
        permissions: ["all"],
      });
      adminRole = await ctx.db.get(roleId);
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let userId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: "admin",
        roleId: adminRole?._id,
        isActive: true,
      });
    } else {
      userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        role: "admin",
        roleId: adminRole?._id,
        isActive: true,
      });
    }

    if (!userId) {
      throw new Error("Unable to create or update admin user");
    }

    const secret = await hashPassword(args.password);
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email)
      )
      .first();

    if (account) {
      await ctx.db.patch(account._id, { userId, secret });
    } else {
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: args.email,
        secret,
      });
    }

    return userId;
  },
});

/**
 * ¡BOTÓN DE UN SOLO CLIC!
 */
export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    assertDevSeedEnabled();
    const adminEmail = "admin@gmail.com";

    // 1. Roles Base
    const baseRoles = [
      {
        name: "Administrador",
        description: "Acceso administrativo total al panel.",
        permissions: ["all"],
      },
      {
        name: "Vendedor",
        description: "Gestión comercial y operación de campo.",
        permissions: ["sales:view", "sales:edit", "routes:view", "clients:view"],
      },
      {
        name: "Bodeguero",
        description: "Gestión de inventario, bodegas y compras.",
        permissions: ["inventory:view", "inventory:edit", "warehouse:view", "suppliers:view"],
      },
    ];

    const roleMap: Record<string, any> = {};
    for (const roleDef of baseRoles) {
      let role = await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", roleDef.name)).unique();
      if (!role) {
        const id = await ctx.db.insert("roles", roleDef);
        role = await ctx.db.get(id);
      }
      if (role) roleMap[role.name] = role;
    }

    const adminRole = roleMap["Administrador"];

    // 2. Crear Admin
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", adminEmail)).first();
    let adminId = existing?._id;

    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin", roleId: adminRole?._id, isActive: true });
    } else {
      adminId = await ctx.db.insert("users", {
        name: "Admin Principal",
        email: adminEmail,
        role: "admin",
        roleId: adminRole?._id,
        isActive: true,
      });
    }

    // 3. Crear Cuenta Auth (admin123456)
    if (adminId) {
      const adminSecret = await hashPassword("admin123456");
      
      const account = await ctx.db.query("authAccounts").filter(q => q.eq(q.field("userId"), adminId)).first();
      if (!account) {
        await ctx.db.insert("authAccounts", {
          userId: adminId,
          provider: "password",
          providerAccountId: adminEmail,
          secret: adminSecret,
        });
      } else {
        await ctx.db.patch(account._id, { secret: adminSecret });
      }
    }

    // 4. Crear Vendedor de Prueba (vendedor@gmail.com / vendedor123)
    const sellerRole = roleMap["Vendedor"];
    const sellerEmail = "vendedor@gmail.com";
    const existingSeller = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", sellerEmail)).first();
    let sellerId = existingSeller?._id;

    if (!existingSeller) {
      sellerId = await ctx.db.insert("users", {
        name: "Vendedor de Prueba",
        email: sellerEmail,
        role: "vendedor",
        roleId: sellerRole?._id,
        isActive: true,
      });
    }

    if (sellerId) {
      const sellerSecret = await hashPassword("vendedor123");
      const sellerAccount = await ctx.db.query("authAccounts").filter(q => q.eq(q.field("userId"), sellerId)).first();
      if (!sellerAccount) {
        await ctx.db.insert("authAccounts", {
          userId: sellerId,
          provider: "password",
          providerAccountId: sellerEmail,
          secret: sellerSecret,
        });
      } else {
        await ctx.db.patch(sellerAccount._id, { secret: sellerSecret });
      }
    }

    // 4.1 Crear Bodeguero de Prueba (bodeguero@gmail.com / bodeguero123)
    const warehouseRole = roleMap["Bodeguero"];
    const warehouseEmail = "bodeguero@gmail.com";
    const existingWarehouseUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", warehouseEmail)).first();
    let warehouseUserId = existingWarehouseUser?._id;

    if (!existingWarehouseUser) {
      warehouseUserId = await ctx.db.insert("users", {
        name: "Bodeguero de Prueba",
        email: warehouseEmail,
        role: "bodeguero",
        roleId: warehouseRole?._id,
        isActive: true,
      });
    }

    if (warehouseUserId) {
      const warehouseSecret = await hashPassword("bodeguero123");
      const warehouseAccount = await ctx.db.query("authAccounts").filter(q => q.eq(q.field("userId"), warehouseUserId)).first();
      if (!warehouseAccount) {
        await ctx.db.insert("authAccounts", {
          userId: warehouseUserId,
          provider: "password",
          providerAccountId: warehouseEmail,
          secret: warehouseSecret,
        });
      } else {
        await ctx.db.patch(warehouseAccount._id, { secret: warehouseSecret });
      }
    }

    // 5. Categorías y Subcategorías de Productos
    const existingCats = await ctx.db.query("product_categories").collect();
    if (existingCats.length === 0) {
      const cat1 = await ctx.db.insert("product_categories", { name: "Abarrotes" });
      const cat2 = await ctx.db.insert("product_categories", { name: "Limpieza" });
      const cat3 = await ctx.db.insert("product_categories", { name: "Bebidas" });

      await ctx.db.insert("product_subcategories", { name: "Arroz y Frijol", categoryId: cat1 });
      await ctx.db.insert("product_subcategories", { name: "Enlatados", categoryId: cat1 });
      await ctx.db.insert("product_subcategories", { name: "Jabones", categoryId: cat2 });
      await ctx.db.insert("product_subcategories", { name: "Refrescos", categoryId: cat3 });
    }

    return adminId;
  },
});
