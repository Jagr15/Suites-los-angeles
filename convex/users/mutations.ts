import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminOrDevMigration } from "../common/utils";
import { hashPassword, verifyPassword } from "../common/hashing";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

const OPERATIONAL_ROLE_NAMES = new Set(["SuperAdmin", "Admin", "Bodeguero", "Vendedor"]);

function normalizeLegacyRoleName(role?: string | null) {
  const normalized = (role || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "superadmin" || normalized === "super admin") return "SuperAdmin";
  if (normalized === "administrador" || normalized === "admin" || normalized === "finanzas") return "Admin";
  if (normalized === "bodega" || normalized === "bodeguero" || normalized === "rutas") return "Bodeguero";
  if (normalized === "vendedor" || normalized === "preventista") return "Vendedor";
  return null;
}

/**
 * Crea o actualiza un usuario manualmente por un administrador.
 */
export const upsertUser = mutation({
  args: {
    id: v.optional(v.id("users")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    profileId: v.optional(v.id("profiles")),
    role: v.optional(v.string()), 
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    password: v.optional(v.string()), // Nueva contraseña opcional
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, email, password, roleId, role: _clientRole, ...userData } = args;
    const operation = id ? "update" : "create";

    if (!email) {
      throw new Error("El correo electrónico es obligatorio");
    }
    if (!roleId) {
      throw new Error("Debe seleccionar un rol válido");
    }
    if (!args.profileId) {
      throw new Error("Debe vincular un perfil");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Perfil vinculado inválido");
    }

    let canonicalRole: string | undefined = undefined;
    const roleDoc = await ctx.db.get(roleId);
    if (!roleDoc) {
      throw new Error("Rol inválido");
    }
    if (!OPERATIONAL_ROLE_NAMES.has(roleDoc.name)) {
      throw new Error("Rol no operativo. Selecciona un rol válido.");
    }
    if (roleDoc.name === "SuperAdmin" && !id) {
      throw new Error("No se permite crear usuarios SuperAdmin desde este flujo.");
    }
    if (roleDoc.name === "SuperAdmin" && id) {
      const existingUser = await ctx.db.get(id);
      if (!existingUser) {
        throw new Error("Usuario no encontrado para actualización.");
      }
      const existingRoleDoc = existingUser.roleId ? await ctx.db.get(existingUser.roleId) : null;
      if (existingRoleDoc?.name !== "SuperAdmin") {
        throw new Error("No se permite asignar SuperAdmin desde este flujo.");
      }
    }
    canonicalRole = roleDoc.name;

    const normalizedUserData = {
      ...userData,
      roleId,
      role: canonicalRole,
      profileId: args.profileId,
    };
    
    let userId: Id<"users"> | undefined = id;
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (id) {
      if (existingByEmail && existingByEmail._id !== id) {
        throw new Error("Ya existe un usuario con este correo.");
      }
      await ctx.db.patch(id, { ...normalizedUserData, email });
    } else {
      if (existingByEmail) {
        return {
          ok: true,
          userId: existingByEmail._id,
          operation: "exists",
          authConfigured: false,
          warning: "Ya existe un usuario con este correo.",
        };
      }
      userId = await ctx.db.insert("users", {
          ...normalizedUserData,
          name: profile.fullName,
          email,
          isActive: normalizedUserData.isActive ?? true,
      });
    }

    let authConfigured = false;
    let warning: string | undefined;

    // SI hay password y email, vinculamos la cuenta de autenticación
    if (password && email && userId) {
      try {
        const hashedSecret = await hashPassword(password);
        
        const existingAccount = await ctx.db
          .query("authAccounts")
          .withIndex("providerAndAccountId", q => 
            q.eq("provider", "password").eq("providerAccountId", email)
          )
          .unique();

        if (existingAccount) {
          await ctx.db.patch(existingAccount._id, { 
            secret: hashedSecret,
            userId: userId // Aseguramos que esté vinculado al user correcto
          });
        } else {
          await ctx.db.insert("authAccounts", {
            userId: userId,
            provider: "password",
            providerAccountId: email,
            secret: hashedSecret,
          });
        }
        authConfigured = true;
      } catch (error) {
        warning = error instanceof Error ? error.message : "No se pudo configurar autenticación.";
      }
    }

    return {
      ok: true,
      userId,
      operation,
      authConfigured,
      warning,
    };
  },
});

/**
 * Normaliza roles de usuarios legacy a roles operativos.
 * Modo preview por defecto (apply=false).
 */
export const normalizeUserRoles = mutation({
  args: {
    apply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrDevMigration(ctx);
    const apply = args.apply === true;

    const roles = await ctx.db.query("roles").collect();
    const users = await ctx.db.query("users").collect();
    const roleById = new Map(roles.map((r) => [r._id, r]));
    const operationalRoleByName = new Map(
      roles.filter((r) => OPERATIONAL_ROLE_NAMES.has(r.name)).map((r) => [r.name, r])
    );

    const unsupportedUsers: Array<{
      userId: string;
      email?: string;
      currentRole?: string;
      currentRoleId?: string;
      reason: string;
    }> = [];
    const planned: Array<{
      userId: string;
      email?: string;
      fromRole?: string;
      fromRoleId?: string;
      toRole: string;
      toRoleId: string;
      action: "update" | "unchanged";
    }> = [];

    for (const user of users) {
      const roleFromId = user.roleId ? roleById.get(user.roleId)?.name : undefined;
      const normalizedFromString = normalizeLegacyRoleName(user.role);
      const normalizedFromRoleId = normalizeLegacyRoleName(roleFromId);
      const targetRoleName = normalizedFromRoleId || normalizedFromString;
      if (!targetRoleName) {
        unsupportedUsers.push({
          userId: String(user._id),
          email: user.email,
          currentRole: user.role,
          currentRoleId: user.roleId ? String(user.roleId) : undefined,
          reason: "No se pudo mapear role/roleId a rol operativo",
        });
        continue;
      }

      const targetRole = operationalRoleByName.get(targetRoleName);
      if (!targetRole) {
        unsupportedUsers.push({
          userId: String(user._id),
          email: user.email,
          currentRole: user.role,
          currentRoleId: user.roleId ? String(user.roleId) : undefined,
          reason: `Rol operativo ${targetRoleName} no existe en roles`,
        });
        continue;
      }

      const unchanged = user.roleId === targetRole._id && user.role === targetRole.name;
      planned.push({
        userId: String(user._id),
        email: user.email,
        fromRole: user.role,
        fromRoleId: user.roleId ? String(user.roleId) : undefined,
        toRole: targetRole.name,
        toRoleId: String(targetRole._id),
        action: unchanged ? "unchanged" : "update",
      });

      if (!unchanged && apply) {
        await ctx.db.patch(user._id, {
          roleId: targetRole._id,
          role: targetRole.name,
        });
      }
    }

    return {
      mode: apply ? "apply" : "preview",
      totalUsers: users.length,
      plannedUpdates: planned.filter((p) => p.action === "update").length,
      unchanged: planned.filter((p) => p.action === "unchanged").length,
      unsupported: unsupportedUsers.length,
      planned,
      unsupportedUsers,
    };
  },
});

function normalizeText(value?: string | null) {
  return (value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function looksLikeConvexId(value: string) {
  const trimmed = value.trim();
  return /^[a-z0-9]+$/i.test(trimmed) && trimmed.length >= 20 && trimmed.length <= 40;
}

/**
 * Normaliza usuarios sin profileId.
 * - preview por defecto (apply=false)
 * - puede crear profile mínimo si createMissingProfiles=true y apply=true
 */
export const normalizeUserProfiles = mutation({
  args: {
    apply: v.optional(v.boolean()),
    createMissingProfiles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrDevMigration(ctx);
    const apply = args.apply === true;
    const createMissingProfiles = args.createMissingProfiles === true;

    const [users, profiles] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("profiles").collect(),
    ]);

    const profileByUserId = new Map(
      profiles.filter((p) => !!p.userId).map((p) => [String(p.userId), p])
    );

    const plan: Array<{
      userId: string;
      email?: string;
      name?: string;
      action: "link_existing_profile" | "create_profile" | "manual_review" | "unchanged";
      profileId?: string;
      reason?: string;
    }> = [];

    for (const user of users) {
      if (user.profileId) {
        plan.push({
          userId: String(user._id),
          email: user.email,
          name: user.name,
          action: "unchanged",
          profileId: String(user.profileId),
        });
        continue;
      }

      const byUserId = profileByUserId.get(String(user._id));
      if (byUserId) {
        plan.push({
          userId: String(user._id),
          email: user.email,
          name: user.name,
          action: "link_existing_profile",
          profileId: String(byUserId._id),
        });
        if (apply) {
          await ctx.db.patch(user._id, { profileId: byUserId._id });
        }
        continue;
      }

      const normalizedUserName = normalizeText(user.name);
      const byName = profiles.find((p) => normalizeText(p.fullName) === normalizedUserName);
      if (byName) {
        plan.push({
          userId: String(user._id),
          email: user.email,
          name: user.name,
          action: "link_existing_profile",
          profileId: String(byName._id),
        });
        if (apply) {
          await ctx.db.patch(user._id, { profileId: byName._id });
        }
        continue;
      }

      if (apply && createMissingProfiles) {
        const profileId = await ctx.db.insert("profiles", {
          userId: user._id,
          fullName: user.name || user.email || "Perfil sin nombre",
          status: "Activo",
          isEmployee: true,
        });
        await ctx.db.patch(user._id, { profileId });
        plan.push({
          userId: String(user._id),
          email: user.email,
          name: user.name,
          action: "create_profile",
          profileId: String(profileId),
        });
        continue;
      }

      plan.push({
        userId: String(user._id),
        email: user.email,
        name: user.name,
        action: "manual_review",
        reason: "No profileId y no profile coincidente encontrado",
      });
    }

    return {
      mode: apply ? "apply" : "preview",
      createMissingProfiles,
      totals: {
        users: users.length,
        unchanged: plan.filter((p) => p.action === "unchanged").length,
        linkExisting: plan.filter((p) => p.action === "link_existing_profile").length,
        createProfile: plan.filter((p) => p.action === "create_profile").length,
        manualReview: plan.filter((p) => p.action === "manual_review").length,
      },
      plan,
    };
  },
});

/**
 * Elimina un usuario (acción reservada).
 */
export const removeUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/**
 * Actualiza el perfil del usuario autenticado.
 */
export const updateMe = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
    password: v.optional(v.string()),
    currentPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !looksLikeConvexId(String(userId))) {
      throw new Error("No autenticado");
    }

    const { name, email, phone, image, password, currentPassword } = args;

    let user = null;
    try {
      user = await ctx.db.get(userId);
    } catch {
      throw new Error("No autenticado");
    }
    if (!user) throw new Error("Usuario no encontrado");

    // 1. Verificación de seguridad si se quiere cambiar el password
    if (password) {
      if (!currentPassword) {
        throw new Error("Debes proporcionar tu contraseña actual para cambiarla");
      }

      const account = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", q => 
          q.eq("provider", "password").eq("providerAccountId", user.email!)
        )
        .unique();

      if (!account) {
        throw new Error("No se encontró una cuenta vinculada para este usuario");
      }

      const isCorrect = await verifyPassword(currentPassword, account.secret!);
      if (!isCorrect) {
        throw new Error("La contraseña actual es incorrecta");
      }

      // Si es correcta, preparamos el nuevo hash
      const hashedSecret = await hashPassword(password);
      await ctx.db.patch(account._id, { secret: hashedSecret });
    }

    // 2. Actualizar datos del perfil
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (image !== undefined) updateData.image = image;

    await ctx.db.patch(userId, updateData);

    // 3. Si el email cambió, actualizamos la cuenta de auth
    if (email && email !== user.email) {
      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", q => 
          q.eq("provider", "password").eq("providerAccountId", user.email!)
        )
        .unique();

      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, { providerAccountId: email });
      }
    }

    return userId;
  },
});
