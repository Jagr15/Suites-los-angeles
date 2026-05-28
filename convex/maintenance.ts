import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "../shared/security/permissions";
import { hashPassword } from "./common/hashing";

function assertDevMaintenanceEnabled() {
  const allow = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  const isDev = deployment.startsWith("dev:");
  if (!allow || !isDev) {
    throw new Error("Maintenance mutation is only allowed in dev with ALLOW_DEV_MIGRATIONS=true.");
  }
}

export const syncCanonicalRolesAndDemoUsers = mutation({
  args: {},
  handler: async (ctx) => {
    assertDevMaintenanceEnabled();

    const canonicalRoles = [
      {
        name: "Admin",
        description: "Gestión operativa completa del negocio.",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.Admin,
      },
      {
        name: "Bodeguero",
        description: "Operación de inventario y bodega.",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.Bodeguero,
      },
      {
        name: "Vendedor",
        description: "Operación comercial y ventas.",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.Vendedor,
      },
      {
        name: "SuperAdmin",
        description: "Acceso total al sistema y gestión completa de seguridad/configuración.",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.SuperAdmin,
      },
    ] as const;

    const roleByName = new Map<string, string>();
    for (const roleDef of canonicalRoles) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleDef.name))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          description: roleDef.description,
          permissions: roleDef.permissions,
        });
        roleByName.set(roleDef.name, String(existing._id));
      } else {
        const id = await ctx.db.insert("roles", roleDef);
        roleByName.set(roleDef.name, String(id));
      }
    }

    const roleRecords = await ctx.db.query("roles").collect();
    const findRoleId = (name: string) => roleRecords.find((r) => r.name === name)?._id;

    const userTargets = [
      { email: "admin@gmail.com", roleName: "Admin", roleString: "Admin" },
      { email: "vendedor@gmail.com", roleName: "Vendedor", roleString: "Vendedor" },
      { email: "bodeguero@gmail.com", roleName: "Bodeguero", roleString: "Bodeguero" },
    ] as const;

    const updatedUsers: string[] = [];
    for (const target of userTargets) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", target.email))
        .first();
      if (!user) continue;
      const roleId = findRoleId(target.roleName);
      await ctx.db.patch(user._id, {
        role: target.roleString,
        roleId,
        isActive: true,
      });
      updatedUsers.push(String(user._id));

      const account = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", target.email)
        )
        .first();
      if (account && account.userId !== user._id) {
        await ctx.db.patch(account._id, { userId: user._id });
      }
    }

    return {
      ok: true,
      rolesUpserted: canonicalRoles.map((r) => r.name),
      updatedUsers,
    };
  },
});

export const repairBodegueroAuth = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertDevMaintenanceEnabled();

    const email = (args.email || "bodeguero@gmail.com").trim().toLowerCase();
    const fullName = (args.fullName || "Bodeguero Demo").trim();

    let role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "Bodeguero"))
      .first();

    if (!role) {
      const roleId = await ctx.db.insert("roles", {
        name: "Bodeguero",
        description: "Operación de inventario y bodega.",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.Bodeguero,
      });
      role = await ctx.db.get(roleId);
    }

    if (!role) {
      throw new Error("No se pudo crear/obtener el rol Bodeguero.");
    }

    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    let user = usersByEmail.find((u) => u.isActive) || usersByEmail[0] || null;
    let userCreated = false;
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: fullName,
        email,
        role: "Bodeguero",
        roleId: role._id,
        isActive: true,
      });
      const createdUser = await ctx.db.get(userId);
      if (!createdUser) {
        throw new Error("No se pudo obtener el usuario recién creado.");
      }
      user = createdUser;
      userCreated = true;
    }

    if (!user) {
      throw new Error("No se pudo crear/obtener el usuario bodeguero.");
    }

    await ctx.db.patch(user._id, {
      name: user.name || fullName,
      email,
      role: "Bodeguero",
      roleId: role._id,
      isActive: true,
    });

    const existingProfile = user.profileId ? await ctx.db.get(user.profileId) : null;
    let profileId = existingProfile?._id;
    let profileCreated = false;

    if (!existingProfile) {
      const profileByUser = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user!._id))
        .first();

      if (profileByUser) {
        profileId = profileByUser._id;
        await ctx.db.patch(profileByUser._id, {
          fullName: profileByUser.fullName || fullName,
          status: "Activo",
          isEmployee: true,
          group: "Bodega",
        });
      } else {
        profileId = await ctx.db.insert("profiles", {
          userId: user._id,
          fullName,
          status: "Activo",
          isEmployee: true,
          group: "Bodega",
        });
        profileCreated = true;
      }
      await ctx.db.patch(user._id, { profileId });
    } else {
      await ctx.db.patch(existingProfile._id, {
        userId: user._id,
        fullName: existingProfile.fullName || fullName,
        status: "Activo",
        isEmployee: true,
        group: "Bodega",
      });
    }

    const passwordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email)
      )
      .collect();

    let deletedOrphanAccounts = 0;
    let accountPatched = 0;
    let accountCreated = 0;
    let linkedAccountId: string | null = null;

    for (const account of passwordAccounts) {
      const accountUser = await ctx.db.get(account.userId as any);
      if (!accountUser) {
        await ctx.db.delete(account._id);
        deletedOrphanAccounts++;
        continue;
      }
      if (String(account.userId) !== String(user._id)) {
        await ctx.db.patch(account._id, { userId: user._id });
        accountPatched++;
      }
      linkedAccountId = String(account._id);
    }

    if (!linkedAccountId) {
      const payload: {
        userId: typeof user._id;
        provider: "password";
        providerAccountId: string;
        secret?: string;
      } = {
        userId: user._id,
        provider: "password",
        providerAccountId: email,
      };
      if (args.password) {
        payload.secret = await hashPassword(args.password);
      }
      const newAccountId = await ctx.db.insert("authAccounts", payload);
      linkedAccountId = String(newAccountId);
      accountCreated++;
    } else if (args.password) {
      const secret = await hashPassword(args.password);
      const account = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", email)
        )
        .first();
      if (account) {
        await ctx.db.patch(account._id, { secret, userId: user._id });
      }
    }

    return {
      ok: true,
      email,
      userId: String(user._id),
      profileId: profileId ? String(profileId) : null,
      roleId: String(role._id),
      userCreated,
      profileCreated,
      accountCreated,
      accountPatched,
      deletedOrphanAccounts,
      linkedAccountId,
    };
  },
});

export const cleanupOrphanAuthAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    assertDevMaintenanceEnabled();

    const accounts = await ctx.db.query("authAccounts").collect();
    let deleted = 0;
    const deletedAccounts: Array<{ id: string; providerAccountId: string }> = [];

    for (const account of accounts) {
      const user = await ctx.db.get(account.userId as any);
      if (!user) {
        await ctx.db.delete(account._id);
        deleted++;
        deletedAccounts.push({
          id: String(account._id),
          providerAccountId: account.providerAccountId,
        });
      }
    }

    return { ok: true, deleted, deletedAccounts };
  },
});

export const normalizeDemoRoleCompatibility = mutation({
  args: {
    apply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const apply = args.apply === true;
    const roleNames = ["Admin", "Vendedor", "Bodeguero"] as const;

    const roles = await ctx.db.query("roles").collect();
    const users = await ctx.db.query("users").collect();

    const canonicalPermissions: Record<(typeof roleNames)[number], string[]> = {
      Admin: DEFAULT_PERMISSIONS_BY_ROLE.Admin,
      Vendedor: DEFAULT_PERMISSIONS_BY_ROLE.Vendedor,
      Bodeguero: DEFAULT_PERMISSIONS_BY_ROLE.Bodeguero,
    };

    const byName = (name: string) => roles.find((r) => r.name === name) || null;
    const adminLegacy = byName("Administrador");
    let adminRole = byName("Admin");

    const roleActions: Array<{ action: string; role?: string; id?: string }> = [];

    if (!adminRole && adminLegacy) {
      roleActions.push({ action: "rename_role", role: "Administrador->Admin", id: String(adminLegacy._id) });
      if (apply) {
        await ctx.db.patch(adminLegacy._id, {
          name: "Admin",
          description: "Gestión operativa completa del negocio.",
          permissions: DEFAULT_PERMISSIONS_BY_ROLE.Admin,
        });
      }
      adminRole = adminLegacy as typeof adminLegacy;
      if (adminRole) adminRole = { ...adminRole, name: "Admin", permissions: DEFAULT_PERMISSIONS_BY_ROLE.Admin };
    }

    if (!adminRole) {
      roleActions.push({ action: "create_role", role: "Admin" });
      if (apply) {
        const id = await ctx.db.insert("roles", {
          name: "Admin",
          description: "Gestión operativa completa del negocio.",
          permissions: DEFAULT_PERMISSIONS_BY_ROLE.Admin,
        });
        adminRole = await ctx.db.get(id);
      }
    }

    if (apply) {
      const freshRoles = await ctx.db.query("roles").collect();
      adminRole = freshRoles.find((r) => r.name === "Admin") || adminRole;
      for (const roleName of ["Vendedor", "Bodeguero"] as const) {
        const role = freshRoles.find((r) => r.name === roleName);
        if (role) {
          await ctx.db.patch(role._id, {
            description:
              roleName === "Vendedor"
                ? "Operación comercial y ventas."
                : "Operación de inventario y bodega.",
            permissions: canonicalPermissions[roleName],
          });
        }
      }
    }

    const roleMap = new Map<string, string>();
    const currentRoles = await ctx.db.query("roles").collect();
    for (const r of currentRoles) roleMap.set(r.name, String(r._id));

    const normalize = (value?: string | null) =>
      (value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const userActions: Array<{ email?: string; action: string; fromRole?: string; toRole?: string }> = [];

    for (const user of users) {
      const roleText = normalize(user.role);
      const roleDoc = user.roleId ? currentRoles.find((r) => String(r._id) === String(user.roleId)) : null;
      const roleDocName = roleDoc?.name || "";

      let targetRoleName: "Admin" | "Vendedor" | "Bodeguero" | null = null;
      if (roleText === "administrador" || roleText === "admin" || normalize(roleDocName) === "administrador" || normalize(roleDocName) === "admin") {
        targetRoleName = "Admin";
      } else if (roleText === "vendedor" || normalize(roleDocName) === "vendedor") {
        targetRoleName = "Vendedor";
      } else if (roleText === "bodeguero" || roleText === "bodega" || normalize(roleDocName) === "bodeguero") {
        targetRoleName = "Bodeguero";
      }
      if (!targetRoleName) continue;

      const targetRoleId = roleMap.get(targetRoleName);
      if (!targetRoleId) continue;

      const needsRolePatch =
        user.role !== targetRoleName || String(user.roleId || "") !== targetRoleId || user.isActive !== true;
      if (needsRolePatch) {
        userActions.push({
          email: user.email,
          action: "patch_user_role",
          fromRole: user.role,
          toRole: targetRoleName,
        });
        if (apply) {
          await ctx.db.patch(user._id, {
            role: targetRoleName,
            roleId: targetRoleId as any,
            isActive: true,
          });
        }
      }
    }

    return {
      mode: apply ? "apply" : "dry_run",
      roleActions,
      userActions,
    };
  },
});
