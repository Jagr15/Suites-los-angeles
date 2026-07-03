import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { getEffectivePermissions } from "../../shared/security/permissions";
import type { Id } from "../_generated/dataModel";

function looksLikeConvexId(value: string) {
  const trimmed = value.trim();
  return /^[a-z0-9]+$/i.test(trimmed) && trimmed.length >= 20 && trimmed.length <= 40;
}

function uniqueById<T extends { _id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [String(item._id), item])).values());
}

export async function resolveCurrentStaffUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const authUserId = await getAuthUserId(ctx);
  const email = identity?.email?.trim().toLowerCase() || "";

  let user = null as any;
  let resolutionSource: "authUserId" | "email" | "none" = "none";

  if (authUserId && looksLikeConvexId(String(authUserId))) {
    try {
      const byAuthId = await ctx.db.get(authUserId);
      if (byAuthId) {
        user = byAuthId;
        resolutionSource = "authUserId";
      }
    } catch {
      // seguir con email
    }
  }

  if (!user && email) {
    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (usersByEmail.length > 0) {
      user = usersByEmail.find((u) => u.isActive !== false) ?? usersByEmail[0];
      resolutionSource = "email";
    }
  }

  const profileDoc: any = user?.profileId ? await ctx.db.get(user.profileId) : null;
  const assignedBodegaId =
    profileDoc?.assignedBodegaId ??
    user?.allowedWarehouseIds?.[0] ??
    null;

  const routesByUser = user?._id
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", user._id))
        .collect()
    : [];
  const routesByAuthUserId = authUserId
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedUserId", (q) => q.eq("assignedUserId", authUserId))
        .collect()
    : [];
  const routesByProfile = profileDoc?._id
    ? await ctx.db
        .query("routes")
        .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", profileDoc._id))
        .collect()
    : [];

  const routes = uniqueById([...routesByUser, ...routesByAuthUserId, ...routesByProfile]);

  return {
    authUserId: authUserId ? String(authUserId) : null,
    email,
    user,
    profile: profileDoc,
    assignedBodegaId,
    operationalBodegaId: assignedBodegaId,
    routes,
    resolutionSource,
  };
}

function isAdminRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "superadmin" || normalized === "super admin";
}

function isSuperAdminRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "superadmin" || normalized === "super admin";
}

function isBodegueroRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "bodeguero" || normalized === "bodega";
}

export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId && looksLikeConvexId(String(userId))) {
    try {
      const currentUser = await ctx.db.get(userId);
      if (currentUser) {
        if (isAdminRoleName(currentUser.role)) return true;
        if (currentUser.roleId) {
          const roleDoc = await ctx.db.get(currentUser.roleId);
          if (isAdminRoleName(roleDoc?.name)) return true;
        }
      }
    } catch {}
  }

  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  if (email) {
    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const user of usersByEmail) {
      if (isAdminRoleName(user.role)) return true;
      if (user.roleId) {
        const roleDoc = await ctx.db.get(user.roleId);
        if (isAdminRoleName(roleDoc?.name)) return true;
      }
    }
  }

  return false;
}

export async function isSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const current = await getCurrentUserWithRole(ctx);
  if (!current) return false;
  if (isSuperAdminRoleName(current.user.role)) return true;
  if (isSuperAdminRoleName((current.roleData as any)?.name)) return true;
  return false;
}

export async function getCurrentUserWithRole(ctx: QueryCtx | MutationCtx) {
  const resolved = await resolveCurrentStaffUser(ctx);
  const user = resolved.user;
  if (!user) return null;
  const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
  return { user, roleData };
}

export async function hasPermission(ctx: QueryCtx | MutationCtx, permission: string | string[]) {
  if (await isAdmin(ctx)) return true;
  const current = await getCurrentUserWithRole(ctx);
  if (!current) return false;
  const requested = Array.isArray(permission) ? permission : [permission];
  const effectivePermissions = getEffectivePermissions({
    rolePermissions: (current.roleData as any)?.permissions || [],
    extraPermissions: current.user.extraPermissions || [],
    disabledPermissions: current.user.disabledPermissions || [],
  });
  if (effectivePermissions.includes("all")) return true;
  return requested.some((p) => effectivePermissions.includes(p));
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string | string[],
  message = "Acceso denegado: No cuentas con permisos suficientes"
) {
  if (!(await hasPermission(ctx, permission))) throw new Error(message);
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  if (!(await isAdmin(ctx))) {
    throw new Error("Acceso denegado: Se requieren permisos de administrador");
  }
}

export async function requireAdminOrDevMigration(ctx: QueryCtx | MutationCtx) {
  if (await isAdmin(ctx)) return;
  const allowDevMigrations = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  const isDevDeployment = deployment.startsWith("dev:");
  if (allowDevMigrations && isDevDeployment) return;
  throw new Error(
    "Acceso denegado: se requieren permisos de administrador o ALLOW_DEV_MIGRATIONS=true en deployment dev."
  );
}

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("No autenticado");
  return userId;
}

export async function getAccessibleWarehouseIds(ctx: QueryCtx | MutationCtx) {
  if (await isAdmin(ctx)) {
    const bodegas = await ctx.db.query("bodegas").collect();
    return bodegas.map((b) => b._id);
  }
  const current = await getCurrentUserWithRole(ctx);
  if (!current) return [] as Id<"bodegas">[];
  if (!isBodegueroRoleName(current.user.role) && !isBodegueroRoleName((current.roleData as any)?.name)) {
    return [] as Id<"bodegas">[];
  }

  const directAssignments = (current.user.allowedWarehouseIds || []).filter(Boolean);
  if (directAssignments.length > 0) return directAssignments;

  const userId = current.user._id;
  const bodegas = await ctx.db.query("bodegas").collect();
  return bodegas
    .filter((b) => (b.allowedUserIds || []).some((id) => String(id) === String(userId)))
    .map((b) => b._id);
}

export async function requireWarehouseAccess(
  ctx: QueryCtx | MutationCtx,
  bodegaId: Id<"bodegas">,
  message = "Acceso denegado: no tienes acceso a esta bodega."
) {
  if (await isAdmin(ctx)) return;
  const accessible = new Set((await getAccessibleWarehouseIds(ctx)).map(String));
  if (!accessible.has(String(bodegaId))) {
    throw new Error(message);
  }
}

export { getEffectivePermissions };
