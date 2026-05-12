import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminOrDevMigration } from "../common/utils";

const OPERATIONAL_ROLES: Array<{
  name: "SuperAdmin" | "Admin" | "Bodeguero" | "Vendedor";
  description: string;
  permissions: string[];
}> = [
  {
    name: "SuperAdmin",
    description: "Acceso total al sistema y gestión completa de seguridad/configuración.",
    permissions: [
      "all",
      "users:manage",
      "settings:manage",
      "sales:view",
      "sales:create",
      "inventory:view",
      "inventory:edit",
      "warehouse:view",
      "warehouse:edit",
      "routes:view",
      "routes:edit",
      "finance:view",
      "finance:edit",
      "suppliers:view",
      "suppliers:edit",
      "clients:view",
      "clients:edit",
    ],
  },
  {
    name: "Admin",
    description: "Gestión operativa completa del negocio.",
    permissions: [
      "users:manage",
      "settings:manage",
      "sales:view",
      "sales:create",
      "inventory:view",
      "inventory:edit",
      "warehouse:view",
      "warehouse:edit",
      "routes:view",
      "routes:edit",
      "finance:view",
      "finance:edit",
      "suppliers:view",
      "suppliers:edit",
      "clients:view",
      "clients:edit",
    ],
  },
  {
    name: "Bodeguero",
    description: "Operación de inventario y bodega.",
    permissions: ["inventory:view", "inventory:edit", "warehouse:view", "warehouse:edit", "routes:view"],
  },
  {
    name: "Vendedor",
    description: "Operación comercial y ventas.",
    permissions: ["sales:view", "sales:create", "clients:view", "clients:edit"],
  },
];

function equalStringArray(a?: string[], b?: string[]) {
  const aa = [...(a || [])].sort();
  const bb = [...(b || [])].sort();
  return JSON.stringify(aa) === JSON.stringify(bb);
}

/**
 * Crea un nuevo rol en el sistema.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("roles", args);
  },
});

/**
 * Actualiza un rol existente.
 */
export const update = mutation({
  args: {
    id: v.id("roles"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

/**
 * Elimina un rol.
 */
export const remove = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Nota: Deberías verificar que no haya usuarios usándolo antes de borrar
    await ctx.db.delete(args.id);
  },
});

/**
 * Upsert idempotente de roles base operativos del sistema.
 * - Crea los roles faltantes.
 * - Actualiza permisos/description de roles existentes.
 * - No borra usuarios ni datos de negocio.
 * - No elimina roles extra (solo deja listAll limitado por query).
 */
export const upsertBaseRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const baseRoles: Array<{
      name: "Administrador" | "Vendedor" | "Bodeguero";
      description: string;
      permissions: string[];
    }> = [
      {
        name: "Administrador",
        description: "Acceso administrativo total al panel.",
        permissions: ["all"],
      },
      {
        name: "Vendedor",
        description: "Gestión comercial y operación de campo.",
        permissions: ["sales:view"],
      },
      {
        name: "Bodeguero",
        description: "Gestión de inventario y operación de bodega.",
        permissions: ["inventory:view", "inventory:edit", "warehouse:view", "routes:view"],
      },
    ];

    const changes: Array<{
      role: string;
      action: "created" | "updated" | "unchanged";
      id: string;
      permissions: string[];
    }> = [];

    for (const roleDef of baseRoles) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleDef.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("roles", roleDef);
        changes.push({
          role: roleDef.name,
          action: "created",
          id: String(id),
          permissions: roleDef.permissions,
        });
        continue;
      }

      const existingPermissions = JSON.stringify(existing.permissions || []);
      const nextPermissions = JSON.stringify(roleDef.permissions);
      const sameDescription = (existing.description || "") === roleDef.description;

      if (existingPermissions === nextPermissions && sameDescription) {
        changes.push({
          role: roleDef.name,
          action: "unchanged",
          id: String(existing._id),
          permissions: existing.permissions || [],
        });
        continue;
      }

      await ctx.db.patch(existing._id, {
        description: roleDef.description,
        permissions: roleDef.permissions,
      });

      changes.push({
        role: roleDef.name,
        action: "updated",
        id: String(existing._id),
        permissions: roleDef.permissions,
      });
    }

    return {
      targetRoles: baseRoles.map((r) => r.name),
      changes,
    };
  },
});

/**
 * Upsert idempotente de los roles operativos canónicos.
 * No elimina roles legacy ni borra datos de negocio.
 */
export const upsertOperationalRoles = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdminOrDevMigration(ctx);
    const changes: Array<{
      role: string;
      action: "created" | "updated" | "unchanged";
      id: string;
      permissions: string[];
    }> = [];

    for (const roleDef of OPERATIONAL_ROLES) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleDef.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("roles", roleDef);
        changes.push({
          role: roleDef.name,
          action: "created",
          id: String(id),
          permissions: roleDef.permissions,
        });
        continue;
      }

      const sameDescription = (existing.description || "") === roleDef.description;
      const samePermissions = equalStringArray(existing.permissions, roleDef.permissions);
      if (sameDescription && samePermissions) {
        changes.push({
          role: roleDef.name,
          action: "unchanged",
          id: String(existing._id),
          permissions: existing.permissions || [],
        });
        continue;
      }

      await ctx.db.patch(existing._id, {
        description: roleDef.description,
        permissions: roleDef.permissions,
      });
      changes.push({
        role: roleDef.name,
        action: "updated",
        id: String(existing._id),
        permissions: roleDef.permissions,
      });
    }

    return {
      targetRoles: OPERATIONAL_ROLES.map((r) => r.name),
      changes,
    };
  },
});
