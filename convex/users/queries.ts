import { query } from "../_generated/server";
import { resolveCurrentStaffUser, getEffectivePermissions } from "../common/utils";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const resolved = await resolveCurrentStaffUser(ctx);
    if (!resolved.user) return null;
    const roleData: any = resolved.user.roleId ? await ctx.db.get(resolved.user.roleId) : null;
    const profileData = resolved.profile;
    const operationalBodegaId = resolved.operationalBodegaId;
    const assignedBodegaId = resolved.assignedBodegaId ?? null;
    const assignedBodega = assignedBodegaId ? await ctx.db.get(assignedBodegaId) : null;
    const activeRoute: any = resolved.routes[0] ?? null;

    return {
      ...resolved.user,
      userId: resolved.user._id,
      authUserId: resolved.authUserId,
      email: resolved.email || resolved.user.email || null,
      name: resolved.user.name || resolved.email || null,
      role: resolved.user.role ?? null,
      profileId: resolved.user.profileId ?? null,
      profile: profileData,
      profileData,
      roleData,
      permissions: Array.from(new Set([
        ...(roleData?.permissions ?? []),
        ...(resolved.user.extraPermissions ?? []),
      ])),
      effectivePermissions: getEffectivePermissions({
        rolePermissions: roleData?.permissions || [],
        extraPermissions: resolved.user.extraPermissions || [],
        disabledPermissions: resolved.user.disabledPermissions || [],
      }),
      isAdmin: resolved.user.role === "admin" || resolved.user.role === "superadmin",
      isWarehouse: (resolved.user.role || "").toLowerCase().includes("bodega"),
      isVendor: (resolved.user.role || "").toLowerCase().includes("vendedor") || (resolved.user.role || "").toLowerCase().includes("ventas") || (resolved.user.role || "").toLowerCase().includes("ruta"),
      assignedBodegaId,
      assignedBodegaName: (assignedBodega as any)?.name ?? null,
      operationalBodegaId,
      operationalBodegaName: (assignedBodega as any)?.name ?? null,
      activeRouteId: activeRoute?._id ?? null,
      activeRouteName: typeof activeRoute?.name === "string" ? activeRoute.name : null,
      routeBindings: {
        assignedUserId: resolved.user._id,
        assignedProfileId: resolved.user.profileId ?? null,
      },
    };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return Promise.all(
      users.map(async (user) => {
        const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
        const profileData = user.profileId ? await ctx.db.get(user.profileId) : null;
        return {
          ...user,
          userId: user._id,
          roleData,
          profileData,
          effectivePermissions: getEffectivePermissions({
            rolePermissions: roleData?.permissions || [],
            extraPermissions: user.extraPermissions || [],
            disabledPermissions: user.disabledPermissions || [],
          }),
        };
      })
    );
  },
});

export const listActiveForSelection = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return Promise.all(
      users.filter((user) => user.isActive !== false).map(async (user) => {
        const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
        const profileData = user.profileId ? await ctx.db.get(user.profileId) : null;
        return {
          ...user,
          userId: user._id,
          roleData,
          profileData,
          effectivePermissions: getEffectivePermissions({
            rolePermissions: roleData?.permissions || [],
            extraPermissions: user.extraPermissions || [],
            disabledPermissions: user.disabledPermissions || [],
          }),
        };
      })
    );
  },
});
