import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, requireIdentity } from "../common/utils";

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
    await requireIdentity(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    return profiles
      .filter((p) => p.status === "Activo")
      .map((p) => ({
        _id: p._id,
        fullName: p.fullName,
        userId: p.userId,
        group: p.group,
      }));
  },
});

/**
 * Lista perfiles activos para selectores operativos.
 */
export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    return profiles
      .filter((p) => p.status === "Activo")
      .map((p) => ({
        _id: p._id,
        fullName: p.fullName,
        userId: p.userId,
        group: p.group,
        status: p.status,
      }));
  },
});

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const email = identity.email?.trim().toLowerCase() || "";
    let user = null;

    if (email) {
      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      user = usersByEmail[0] ?? null;
    }

    if (!user) {
      const authUserId = await getAuthUserId(ctx);
      if (authUserId) {
        try {
          user = await ctx.db.get(authUserId);
        } catch {
          user = null;
        }
      }
    }

    if (!user) return null;
    if (!user.profileId) return null;

    const profile = await ctx.db.get(user.profileId);
    if (!profile) return null;

    return {
      ...profile,
      user,
    };
  },
});
