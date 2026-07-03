import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireIdentity } from "../common/utils";
import { resolveCurrentStaffUser } from "../common/utils";

/**
 * Lista todos los perfiles de recursos humanos.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("profiles").collect();
  },
});

/**
 * Obtiene un perfil por ID.
 */
export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Lista perfiles disponibles para selects en formularios operativos.
 */
export const listForSelection = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireIdentity(ctx);
      const profiles = await ctx.db.query("profiles").collect();
      return profiles
        .filter((p) => String(p.status || "").trim() === "Activo")
        .map((p) => ({
          _id: p._id,
          fullName: String(p.fullName || "").trim() || "Sin nombre",
          userId: p.userId,
          group: p.group,
        }));
    } catch (error) {
      console.error("profiles.listForSelection failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

/**
 * Lista perfiles activos para selectores operativos.
 */
export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireIdentity(ctx);
      const profiles = await ctx.db.query("profiles").collect();
      return profiles
        .filter((p) => String(p.status || "").trim() === "Activo")
        .map((p) => ({
          _id: p._id,
          fullName: String(p.fullName || "").trim() || "Sin nombre",
          userId: p.userId,
          group: p.group,
          status: p.status,
        }));
    } catch (error) {
      console.error("profiles.listActiveForSelection failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const resolved = await resolveCurrentStaffUser(ctx);
    const profile = resolved.profile;
    if (!profile) return null;

    return {
      ...profile,
      user: resolved.user,
    };
  },
});
