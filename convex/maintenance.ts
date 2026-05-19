import { mutation } from "./_generated/server";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "../shared/security/permissions";

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

