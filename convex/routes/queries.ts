import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const isLikelyConvexId = (value: unknown) =>
  typeof value === "string" && value.includes("|");

type RouteLike = {
  assetId?: Id<"assets">;
  vehicleId?: string;
};

async function safeGetAssetFromRoute(ctx: QueryCtx, route: RouteLike) {
  let asset = null;

  if (route.assetId) {
    asset = await ctx.db.get(route.assetId);
  }
  if (asset || !route.vehicleId || !isLikelyConvexId(route.vehicleId)) {
    return asset;
  }

  try {
    const vehicle = await ctx.db.get(route.vehicleId as Id<"vehicles">);
    if (vehicle?.assetId) {
      return await ctx.db.get(vehicle.assetId);
    }
  } catch {
    return asset;
  }

  return asset;
}

/**
 * Obtiene todas las rutas.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      const routes = await ctx.db.query("routes").collect();

      return Promise.all(
        routes.map(async (route) => {
          const profile = route.assignedProfileId ? await ctx.db.get(route.assignedProfileId) : null;
          const user = route.assignedUserId ? await ctx.db.get(route.assignedUserId) : null;
          const userProfile = user?.profileId ? await ctx.db.get(user.profileId) : null;
          const asset = await safeGetAssetFromRoute(ctx, route);
          return {
            ...route,
            routeType: route.routeType || "Interna",
            assetId: route.assetId || asset?._id,
            assignedUserName: userProfile?.fullName ?? user?.name ?? user?.email ?? "Desconocido",
            assignedProfileName: profile?.fullName ?? userProfile?.fullName ?? "Desconocido",
            vehicleInfo: asset ? `${asset.name} (${asset.serialNumber || "S/N"})` : "Sin transporte",
          };
        })
      );
    } catch (error) {
      console.error("routes.list failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    try {
      const routes = await ctx.db.query("routes").collect();
      return Promise.all(
        routes
          .filter((route) => route.isActive !== false)
          .map(async (route) => {
            const asset = await safeGetAssetFromRoute(ctx, route);
            return {
              ...route,
              routeType: route.routeType || "Interna",
              assetId: route.assetId || asset?._id,
              vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
            };
          })
      );
    } catch (error) {
      console.error("routes.listActiveForSelection failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

/**
 * Obtiene una ruta por su ID.
 */
export const getById = query({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
/**
 * Lista las rutas asignadas a un perfil específico.
 */
export const listByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    try {
      const routes = await ctx.db
        .query("routes")
        .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", args.profileId))
        .collect();

      return Promise.all(
        routes.map(async (route) => {
          const asset = await safeGetAssetFromRoute(ctx, route);
          return {
            ...route,
            routeType: route.routeType || "Interna",
            assetId: route.assetId || asset?._id,
            vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
          };
        })
      );
    } catch (error) {
      console.error("routes.listByProfile failed", {
        profileId: String(args.profileId),
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

/**
 * Lista rutas asignadas al usuario autenticado.
 */
export const listByCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) return [];
      const authUserId = await getAuthUserId(ctx);

      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .collect();
      const resolvedUser = usersByEmail.find((user) => user.isActive !== false) ?? usersByEmail[0] ?? null;
      if (!resolvedUser && !authUserId) return [];

      const profileId = resolvedUser?.profileId ?? null;
      const routeSets = await Promise.all([
        resolvedUser?._id
          ? ctx.db
              .query("routes")
              .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", resolvedUser._id))
              .collect()
          : [],
        authUserId
          ? ctx.db
              .query("routes")
              .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", authUserId))
              .collect()
          : [],
        profileId
          ? ctx.db
              .query("routes")
              .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", profileId))
              .collect()
          : [],
      ]);
      const routes = Array.from(new Map(routeSets.flat().map((route) => [String(route._id), route])).values());

      return Promise.all(
        routes.map(async (route) => {
          const asset = await safeGetAssetFromRoute(ctx, route);
          return {
            ...route,
            routeType: route.routeType || "Interna",
            assetId: route.assetId || asset?._id,
            assignedUserName: resolvedUser?.name || resolvedUser?.email || "Desconocido",
            vehicleInfo: asset ? `${asset.name} (${asset.plate || "S/P"})` : "Sin transporte",
          };
        })
      );
    } catch (error) {
      console.error("routes.listByCurrentUser failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const listForCurrentUser = listByCurrentUser;
