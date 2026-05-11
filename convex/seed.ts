import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./common/hashing";

/**
 * Función genérica para crear cualquier admin.
 */
export const createFirstAdmin = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin", isActive: true });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: "admin",
      isActive: true,
    });
  },
});

/**
 * ¡BOTÓN DE UN SOLO CLIC!
 */
export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const adminEmail = "admin@gmail.com";

    // 1. Roles Base
    const baseRoles = [
      { name: "SuperAdmin", description: "Acceso total", permissions: ["all"] },
      { name: "Admin", description: "Acceso total al sistema", permissions: ["all"] },
      { name: "Finanzas", description: "Gestión de cobros", permissions: ["finances:view"] },
      { name: "Bodega", description: "Gestión de inventario", permissions: ["warehouse:view"] },
      { name: "Rutas", description: "Gestión de rutas", permissions: ["routes:view"] },
      { name: "Vendedor", description: "Gestión de pedidos", permissions: ["orders:view"] },
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

    const adminRole = roleMap["Admin"];

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
