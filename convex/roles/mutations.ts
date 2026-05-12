import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

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
