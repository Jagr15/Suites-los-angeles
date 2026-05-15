import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";

function looksLikeConvexId(value: string) {
  const trimmed = value.trim();
  return /^[a-z0-9]+$/i.test(trimmed) && trimmed.length >= 20 && trimmed.length <= 40;
}

function isAdminRoleName(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "superadmin" || normalized === "super admin";
}

/**
 * Verifica si el usuario actual tiene rol de administrador.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);

  // 1) Verificación directa por el userId autenticado (si existe y es válido)
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
    } catch {
      // Subject inválido o no decodificable: seguimos con fallback seguro por email.
    }
  }

  // 2) Fallback por email para casos de duplicado auth user<->staff user
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

export async function getCurrentUserWithRole(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId && looksLikeConvexId(String(userId))) {
    try {
      const byId = await ctx.db.get(userId);
      if (byId) {
        const roleData = byId.roleId ? await ctx.db.get(byId.roleId) : null;
        return { user: byId, roleData };
      }
    } catch {
      // subject inválido: seguimos con fallback por email.
    }
  }

  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  if (!email) return null;

  const usersByEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  if (usersByEmail.length === 0) return null;

  const user = usersByEmail[0];
  const roleData = user.roleId ? await ctx.db.get(user.roleId) : null;
  return { user, roleData };
}

export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string | string[]
) {
  if (await isAdmin(ctx)) return true;
  const current = await getCurrentUserWithRole(ctx);
  if (!current) return false;
  const requested = Array.isArray(permission) ? permission : [permission];
  const rolePerms = current.roleData?.permissions || [];
  if (rolePerms.includes("all")) return true;
  return requested.some((p) => rolePerms.includes(p));
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string | string[],
  message = "Acceso denegado: No cuentas con permisos suficientes"
) {
  if (!(await hasPermission(ctx, permission))) {
    throw new Error(message);
  }
}

/**
 * Lanza un error si el usuario actual no es administrador.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  if (!(await isAdmin(ctx))) {
    throw new Error("Acceso denegado: Se requieren permisos de administrador");
  }
}

/**
 * Permite ejecutar migraciones desde CLI únicamente en DEV cuando
 * ALLOW_DEV_MIGRATIONS=true y CONVEX_DEPLOYMENT indica entorno dev.
 * En cualquier otro caso exige admin autenticado.
 */
export async function requireAdminOrDevMigration(ctx: QueryCtx | MutationCtx) {
  if (await isAdmin(ctx)) return;

  const allowDevMigrations = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  const isDevDeployment = deployment.startsWith("dev:");

  if (allowDevMigrations && isDevDeployment) {
    return;
  }

  throw new Error(
    "Acceso denegado: se requieren permisos de administrador o ALLOW_DEV_MIGRATIONS=true en deployment dev."
  );
}

/**
 * Lanza un error si el usuario no está autenticado.
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("No autenticado");
  }
  return userId;
}
