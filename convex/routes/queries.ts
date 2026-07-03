import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { resolveCurrentStaffUser } from "../common/utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    return Promise.all(
      routes.map(async (route) => {
        const profile = route.assignedProfileId ? await ctx.db.get(route.assignedProfileId) : null;
        const user = route.assignedUserId ? await ctx.db.get(route.assignedUserId) : null;
        return {
          ...route,
          assignedUserName: user?.name ?? user?.email ?? "Desconocido",
          assignedProfileName: profile?.fullName ?? "Desconocido",
          vehicleInfo: "Sin transporte",
        };
      })
    );
  },
});

export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    return Promise.all(
      routes.filter((route) => route.isActive !== false).map(async (route) => {
        const asset = route.assetId ? await ctx.db.get(route.assetId) : null;
        return {
          ...route,
          assignedUserName: "Desconocido",
          vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
        };
      })
    );
  },
});

export const listByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const routes = await ctx.db.query("routes").collect();
    const filtered = routes.filter((route) => String(route.assignedProfileId || "") === String(args.profileId));
    return Promise.all(
      filtered.map(async (route) => {
        const asset = route.assetId ? await ctx.db.get(route.assetId) : null;
        return {
          ...route,
          vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listByCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveCurrentStaffUser(ctx);
    if (!currentUser.user) return [];
    return Promise.all(
      currentUser.routes.map(async (route) => {
        const asset = route.assetId ? await ctx.db.get(route.assetId) : null;
        return {
          ...route,
          assignedUserName: currentUser.user.name ?? currentUser.email ?? "Desconocido",
          vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
        };
      })
    );
  },
});

export const listForCurrentUser = listByCurrentUser;
