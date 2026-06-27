import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "../shared/security/permissions";
import { hashPassword } from "./common/hashing";
import { isAdmin } from "./common/utils";
import { ensureWarehouseMovementSequence, numberToWarehouseCode } from "./common/warehouseFolios";
import { auditPasswordAccountsForEmail, ensurePasswordAccountForUser } from "./common/authAccounts";
import type { Id } from "./_generated/dataModel";

function assertDevMaintenanceEnabled() {
  const allow = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  const isDev = deployment.startsWith("dev:");
  if (!allow || !isDev) {
    throw new Error("Maintenance mutation is only allowed in dev with ALLOW_DEV_MIGRATIONS=true.");
  }
}

async function assertProdMaintenanceAccess(ctx: any) {
  if (await isAdmin(ctx)) return;
  const allowProd = (process.env.ALLOW_PROD_MAINTENANCE || "").trim().toLowerCase() === "true";
  if (allowProd) return;
  throw new Error(
    "Acceso denegado: requiere admin o mantenimiento productivo habilitado por entorno."
  );
}

async function assertSeedMaintenanceAccess(ctx: any) {
  const deployment = (process.env.CONVEX_DEPLOYMENT || "").trim().toLowerCase();
  if (deployment.startsWith("dev:")) {
    const allowDev = (process.env.ALLOW_DEV_MIGRATIONS || "").trim().toLowerCase() === "true";
    if (allowDev) return;
    throw new Error("Dev maintenance is disabled. Set ALLOW_DEV_MIGRATIONS=true to enable.");
  }

  if (await isAdmin(ctx)) return;
  const allowProd = (process.env.ALLOW_PROD_MAINTENANCE || "").trim().toLowerCase() === "true";
  if (allowProd) return;
  throw new Error(
    "Acceso denegado: requiere admin o mantenimiento productivo habilitado por entorno."
  );
}

const DEMO_PASSWORD_TARGETS = [
  { email: "admin1@gmail.com", password: "admin123", name: "Admin Demo 1", roleName: "Admin", roleString: "Admin", group: "Administración" as const },
  { email: "admin2@gmail.com", password: "admin123", name: "Admin Demo 2", roleName: "Admin", roleString: "Admin", group: "Administración" as const },
  { email: "admin3@gmail.com", password: "admin123", name: "Admin Demo 3", roleName: "Admin", roleString: "Admin", group: "Administración" as const },
  { email: "vendedor1@gmail.com", password: "vendedor123", name: "Vendedor Demo 1", roleName: "Vendedor", roleString: "Vendedor", group: "Ventas" as const },
  { email: "vendedor2@gmail.com", password: "vendedor123", name: "Vendedor Demo 2", roleName: "Vendedor", roleString: "Vendedor", group: "Ventas" as const },
  { email: "vendedor3@gmail.com", password: "vendedor123", name: "Vendedor Demo 3", roleName: "Vendedor", roleString: "Vendedor", group: "Ventas" as const },
  { email: "bodeguero1@gmail.com", password: "bodeguero123", name: "Bodeguero Demo 1", roleName: "Bodeguero", roleString: "Bodeguero", group: "Bodega" as const },
  { email: "bodeguero2@gmail.com", password: "bodeguero123", name: "Bodeguero Demo 2", roleName: "Bodeguero", roleString: "Bodeguero", group: "Bodega" as const },
  { email: "bodeguero3@gmail.com", password: "bodeguero123", name: "Bodeguero Demo 3", roleName: "Bodeguero", roleString: "Bodeguero", group: "Bodega" as const },
] as const;

export const syncCanonicalRolesAndDemoUsers = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedMaintenanceAccess(ctx);

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

    const ensureProfileForUser = async (
      userId: any,
      fullName: string,
      group: "Administración" | "Ventas" | "Bodega"
    ) => {
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (existingProfile) {
        const patch: Record<string, unknown> = {};
        if (existingProfile.fullName !== fullName) patch.fullName = fullName;
        if (existingProfile.status !== "Activo") patch.status = "Activo";
        if (existingProfile.isEmployee !== true) patch.isEmployee = true;
        if (existingProfile.group !== group) patch.group = group;
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(existingProfile._id, patch as any);
        }
        return existingProfile._id;
      }

      return await ctx.db.insert("profiles", {
        userId,
        fullName,
        status: "Activo",
        isEmployee: true,
        group,
      });
    };

    const updatedUsers: string[] = [];
    for (const target of DEMO_PASSWORD_TARGETS) {
      const roleId = findRoleId(target.roleName);
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", target.email))
        .first();

      if (!user) {
        const userId = await ctx.db.insert("users", {
          name: target.name,
          email: target.email,
          role: target.roleString,
          roleId,
          isActive: true,
          allowedWarehouseIds: target.roleName === "Bodeguero" ? [] : [],
        });
        user = await ctx.db.get(userId);
      } else {
        await ctx.db.patch(user._id, {
          name: target.name,
          role: target.roleString,
          roleId,
          isActive: true,
          allowedWarehouseIds: target.roleName === "Bodeguero" ? (user.allowedWarehouseIds || []) : [],
        });
        user = await ctx.db.get(user._id);
      }

      if (!user) continue;

      const profileId = await ensureProfileForUser(user._id, target.name, target.group);
      if (String(user.profileId || "") !== String(profileId)) {
        await ctx.db.patch(user._id, { profileId });
      }

      await ensurePasswordAccountForUser(ctx, {
        userId: user._id,
        email: target.email,
        password: target.password,
      });
      updatedUsers.push(String(user._id));
    }

    const targetEmails = new Set<string>(DEMO_PASSWORD_TARGETS.map((u) => u.email));
    const passwordAccounts = (await ctx.db.query("authAccounts").collect()).filter((account) => account.provider === "password");
    for (const account of passwordAccounts) {
      if (!targetEmails.has(account.providerAccountId)) continue;
      const matchedUser = DEMO_PASSWORD_TARGETS.find((target) => target.email === account.providerAccountId);
      if (!matchedUser) continue;
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", matchedUser.email))
        .first();
      if (user && String(account.userId) !== String(user._id)) {
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

export const repairDemoUserPasswordAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedMaintenanceAccess(ctx);

    const results: Array<{
      email: string;
      status: "updated" | "missing_user";
      accountId?: string;
    }> = [];

    for (const target of DEMO_PASSWORD_TARGETS) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", target.email))
        .first();
      if (!user) {
        results.push({ email: target.email, status: "missing_user" });
        continue;
      }

      const repair = await ensurePasswordAccountForUser(ctx, {
        userId: user._id,
        email: target.email,
        password: target.password,
      });
      results.push({ email: target.email, status: "updated", accountId: repair.accountId });
    }

    return {
      ok: true,
      results,
    };
  },
});

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function todayWeekdayCode(date = new Date()) {
  return ["D", "L", "M", "X", "J", "V", "S"][date.getDay()];
}

function getOperationalDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("No se pudo calcular la fecha operativa");
  return `${year}-${month}-${day}`;
}

async function resolveDemoUserContext(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase() || "";
  const authUserId = await getAuthUserId(ctx);
  let resolvedUser = null;

  if (email) {
    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .collect();
    if (usersByEmail.length > 0) {
      resolvedUser = usersByEmail.find((user: any) => user.isActive !== false) ?? usersByEmail[0] ?? null;
    }
  }

  if (!resolvedUser && authUserId) {
    try {
      resolvedUser = await ctx.db.get(authUserId);
    } catch {
      resolvedUser = null;
    }
  }

  const profileId = resolvedUser?.profileId ?? null;
  const profile = profileId ? await ctx.db.get(profileId) : null;
  const profileRecord = profile as any;
  const operationalBodegaId =
    profileRecord?.assignedBodegaId ??
    resolvedUser?.allowedWarehouseIds?.[0] ??
    null;

  const routeBindings = {
    byAssignedUserId: resolvedUser?._id
      ? await ctx.db
          .query("routes")
          .withIndex("by_assignedUserId", (q: any) => q.eq("assignedUserId", resolvedUser._id))
          .collect()
      : [],
    byAuthUserId: authUserId
      ? await ctx.db
          .query("routes")
          .withIndex("by_assignedUserId", (q: any) => q.eq("assignedUserId", authUserId))
          .collect()
      : [],
    byAssignedProfileId: profileId
      ? await ctx.db
          .query("routes")
          .withIndex("by_assignedProfileId", (q: any) => q.eq("assignedProfileId", profileId))
          .collect()
      : [],
  };

  return {
    authUserId: authUserId ? String(authUserId) : null,
    resolvedUser,
    email,
    profileId: profileId ? String(profileId) : null,
    operationalBodegaId: operationalBodegaId ? String(operationalBodegaId) : null,
    routeBindings,
  };
}

export const debugVendorRouteResolution = query({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const context = await resolveDemoUserContext(ctx);
    const email = args.email?.trim().toLowerCase() || context.email;
    let resolvedUser = context.resolvedUser;

    if (email) {
      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q: any) => q.eq("email", email))
        .collect();
      resolvedUser = usersByEmail.find((user: any) => user.isActive !== false) ?? usersByEmail[0] ?? resolvedUser;
    }

    const profileId = resolvedUser?.profileId ?? context.profileId;
    const profile = profileId ? await ctx.db.get(profileId) : null;
    const profileRecord = profile as any;
    const operationalBodegaId =
      profileRecord?.assignedBodegaId ??
      resolvedUser?.allowedWarehouseIds?.[0] ??
      context.operationalBodegaId ??
      null;
    const authUserId = context.authUserId;
    const routeBindings = {
      byAssignedUserId: resolvedUser?._id
        ? await ctx.db
            .query("routes")
            .withIndex("by_assignedUserId", (q: any) => q.eq("assignedUserId", resolvedUser._id))
            .collect()
        : [],
      byAuthUserId: authUserId
        ? await ctx.db
            .query("routes")
            .withIndex("by_assignedUserId", (q: any) => q.eq("assignedUserId", authUserId))
            .collect()
        : [],
      byAssignedProfileId: profileId
        ? await ctx.db
            .query("routes")
            .withIndex("by_assignedProfileId", (q: any) => q.eq("assignedProfileId", profileId))
            .collect()
        : [],
    };
    const routeIds = new Set<string>();
    for (const route of [
      ...routeBindings.byAssignedUserId,
      ...routeBindings.byAuthUserId,
      ...routeBindings.byAssignedProfileId,
    ]) {
      routeIds.add(String(route._id));
    }

    const routes = await Promise.all(
      Array.from(routeIds).map(async (routeId) => {
        const route = await ctx.db.get(routeId as any);
        return route
          ? {
              _id: String((route as any)._id),
              name: String((route as any).name || ""),
              isActive: Boolean((route as any).isActive),
              status: (route as any).status ?? null,
              days: (route as any).operationDays || [],
              diasOperacion: (route as any).diasOperacion || null,
              assignedUserId: (route as any).assignedUserId ? String((route as any).assignedUserId) : null,
              assignedProfileId: (route as any).assignedProfileId ? String((route as any).assignedProfileId) : null,
              bodegaId: (route as any).bodegaId ? String((route as any).bodegaId) : null,
            }
          : null;
      })
    );

    return {
      authUserId,
      resolvedUser,
      email,
      profileId: profileId ? String(profileId) : null,
      operationalBodegaId: operationalBodegaId ? String(operationalBodegaId) : null,
      routeBindings,
      routes: routes.filter(Boolean),
    };
  },
});

async function ensureQaVendorBodega(ctx: any, summary: Record<string, unknown>) {
  const preferredName = "Centro de Distribución";
  const fallbackName = "Bodega QA App";
  const existing =
    (await ctx.db.query("bodegas").withIndex("by_name", (q: any) => q.eq("name", preferredName)).first()) ||
    (await ctx.db.query("bodegas").withIndex("by_name", (q: any) => q.eq("name", fallbackName)).first());

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (existing.name !== preferredName && normalizeText(existing.name) !== normalizeText(fallbackName)) {
      patch.name = preferredName;
    }
    if (existing.isActive !== true) patch.isActive = true;
    if (JSON.stringify(existing.allowedUserIds || []) !== JSON.stringify([])) patch.allowedUserIds = [];
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
    summary.bodegaId = String(existing._id);
    summary.bodegaName = patch.name || existing.name;
    return existing;
  }

  const id = await ctx.db.insert("bodegas", {
    code: undefined,
    name: fallbackName,
    description: "Bodega de QA para validación del vendedor móvil.",
    address: "QA",
    manager: "QA",
    isActive: true,
    allowedUserIds: [],
  });
  const created = await ctx.db.get(id);
  summary.bodegaId = String(id);
  summary.bodegaName = fallbackName;
  return created;
}

async function ensureQaVendorUserAndProfile(ctx: any, summary: Record<string, unknown>) {
  const userEmail = "vendedor1@gmail.com";
  const userName = "Vendedor Demo 1";
  const role = await ctx.db.query("roles").withIndex("by_name", (q: any) => q.eq("name", "Vendedor")).first();
  let user = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", userEmail)).first();

  if (user) {
    const patch: Record<string, unknown> = {};
    if (user.name !== userName) patch.name = userName;
    if (user.role !== "Vendedor") patch.role = "Vendedor";
    if (role && String(user.roleId || "") !== String(role._id)) patch.roleId = role._id;
    if (user.isActive !== true) patch.isActive = true;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
      user = await ctx.db.get(user._id);
    }
  } else {
    const userId = await ctx.db.insert("users", {
      name: userName,
      email: userEmail,
      role: "Vendedor",
      roleId: role?._id,
      isActive: true,
    });
    user = await ctx.db.get(userId);
  }

  if (!user) throw new Error("No se pudo resolver el usuario QA del vendedor");

  let profile = user.profileId ? await ctx.db.get(user.profileId) : null;
  if (profile) {
    const patch: Record<string, unknown> = {};
    if (profile.fullName !== userName) patch.fullName = userName;
    if (profile.status !== "Activo") patch.status = "Activo";
    if (profile.group !== "Ventas") patch.group = "Ventas";
    if (profile.isEmployee !== true) patch.isEmployee = true;
    if (profile.workplaceType !== "Ruta") patch.workplaceType = "Ruta";
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(profile._id, patch);
      profile = await ctx.db.get(profile._id);
    }
  } else {
    const profileId = await ctx.db.insert("profiles", {
      fullName: userName,
      userId: user._id,
      status: "Activo",
      isEmployee: true,
      group: "Ventas",
      workplaceType: "Ruta",
    });
    profile = await ctx.db.get(profileId);
    await ctx.db.patch(user._id, { profileId });
  }

  summary.userId = String(user._id);
  summary.profileId = profile ? String(profile._id) : null;

  return { user, profile };
}

async function ensureQaVendorRoute(ctx: any, summary: Record<string, unknown>, args: {
  userId: Id<"users">;
  profileId: Id<"profiles">;
  bodegaId: Id<"bodegas">;
}) {
  const routeName = "Ruta QA App";
  const todayDay = todayWeekdayCode();
  const existing = await ctx.db.query("routes").withIndex("by_name", (q: any) => q.eq("name", routeName)).first();

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (existing.assignedUserId !== args.userId) patch.assignedUserId = args.userId;
    if (existing.assignedProfileId !== args.profileId) patch.assignedProfileId = args.profileId;
    if (existing.isActive !== true) patch.isActive = true;
    if (!existing.operationDays?.includes(todayDay)) patch.operationDays = Array.from(new Set([...(existing.operationDays || []), todayDay]));
    if (existing.loadDay !== todayDay) patch.loadDay = todayDay;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
    summary.routeId = String(existing._id);
    summary.routeName = routeName;
    return existing;
  }

  const id = await ctx.db.insert("routes", {
    name: routeName,
    destination: "QA",
    deliveryType: "sucursal",
    routeType: "Interna",
    assignedUserId: args.userId,
    assignedProfileId: args.profileId,
    operationDays: [todayDay, "L", "M", "X", "J", "V"],
    loadDay: todayDay,
    isActive: true,
    requireGpsValidation: true,
    gpsRadiusLimit: 100,
    allowLocationUpdate: true,
    requireKmTracking: false,
    allowOffHoursSales: false,
    requireVisitOrder: false,
    allowNoSaleCheckIn: true,
    requireMinVisitTime: false,
    minVisitTimeMinutes: 0,
    startLat: 19.2433,
    startLng: -103.7247,
    stops: [
      { name: "QA Stop 1", lat: 19.2437, lng: -103.7252 },
    ],
  });
  summary.routeId = String(id);
  summary.routeName = routeName;
  return await ctx.db.get(id);
}

async function ensureQaClients(ctx: any, summary: Record<string, unknown>, routeId: Id<"routes">) {
  const clientsInput = [
    {
      commercialName: "Cliente QA App 1",
      buyerName: "QA Buyer 1",
      businessName: "Cliente QA App 1 SA de CV",
      rfc: "QAA001010AA1",
      mapsUrl: "https://www.google.com/maps?q=19.2437,-103.7252",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2437,
      lng: -103.7252,
      creditLimit: 5000,
      creditDays: 15,
      visitOrder: 1,
    },
    {
      commercialName: "Cliente QA App 2",
      buyerName: "QA Buyer 2",
      businessName: "Cliente QA App 2 SA de CV",
      rfc: "QAA002020AA2",
      mapsUrl: "https://www.google.com/maps?q=19.2441,-103.7241",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2441,
      lng: -103.7241,
      creditLimit: 5000,
      creditDays: 15,
      visitOrder: 2,
    },
    {
      commercialName: "Cliente QA App 3",
      buyerName: "QA Buyer 3",
      businessName: "Cliente QA App 3 SA de CV",
      rfc: "QAA003030AA3",
      mapsUrl: "https://www.google.com/maps?q=19.2444,-103.7238",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2444,
      lng: -103.7238,
      creditLimit: 3500,
      creditDays: 10,
      visitOrder: 3,
    },
    {
      commercialName: "Cliente QA App 4",
      buyerName: "QA Buyer 4",
      businessName: "Cliente QA App 4 SA de CV",
      rfc: "QAA004040AA4",
      mapsUrl: "https://www.google.com/maps?q=19.2448,-103.7234",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2448,
      lng: -103.7234,
      creditLimit: 4500,
      creditDays: 15,
      visitOrder: 4,
    },
    {
      commercialName: "Cliente QA App 5",
      buyerName: "QA Buyer 5",
      businessName: "Cliente QA App 5 SA de CV",
      rfc: "QAA005050AA5",
      mapsUrl: "https://www.google.com/maps?q=19.2452,-103.7231",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2452,
      lng: -103.7231,
      creditLimit: 6000,
      creditDays: 20,
      visitOrder: 5,
    },
    {
      commercialName: "Cliente QA App 6",
      buyerName: "QA Buyer 6",
      businessName: "Cliente QA App 6 SA de CV",
      rfc: "QAA006060AA6",
      mapsUrl: "https://www.google.com/maps?q=19.2455,-103.7227",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2455,
      lng: -103.7227,
      creditLimit: 8000,
      creditDays: 25,
      visitOrder: 6,
    },
    {
      commercialName: "Cliente QA App 7",
      buyerName: "QA Buyer 7",
      businessName: "Cliente QA App 7 SA de CV",
      rfc: "QAA007070AA7",
      mapsUrl: "https://www.google.com/maps?q=19.2459,-103.7224",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2459,
      lng: -103.7224,
      creditLimit: 5500,
      creditDays: 15,
      visitOrder: 7,
    },
    {
      commercialName: "Cliente QA App 8",
      buyerName: "QA Buyer 8",
      businessName: "Cliente QA App 8 SA de CV",
      rfc: "QAA008080AA8",
      mapsUrl: "https://www.google.com/maps?q=19.2462,-103.7221",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2462,
      lng: -103.7221,
      creditLimit: 7000,
      creditDays: 18,
      visitOrder: 8,
    },
    {
      commercialName: "Cliente QA App 9",
      buyerName: "QA Buyer 9",
      businessName: "Cliente QA App 9 SA de CV",
      rfc: "QAA009090AA9",
      mapsUrl: "https://www.google.com/maps?q=19.2465,-103.7218",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2465,
      lng: -103.7218,
      creditLimit: 4000,
      creditDays: 12,
      visitOrder: 9,
    },
    {
      commercialName: "Cliente QA App 10",
      buyerName: "QA Buyer 10",
      businessName: "Cliente QA App 10 SA de CV",
      rfc: "QAA010100AA0",
      mapsUrl: "https://www.google.com/maps?q=19.2468,-103.7214",
      stateId: "06",
      stateName: "Colima",
      municipalityId: "002",
      municipalityName: "Colima",
      townId: "0001",
      townName: "Colima",
      lat: 19.2468,
      lng: -103.7214,
      creditLimit: 9000,
      creditDays: 30,
      visitOrder: 10,
    },
  ];

  const ids: string[] = [];
  for (const input of clientsInput) {
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_commercialName", (q: any) => q.eq("commercialName", input.commercialName))
      .first();
    if (existing) {
      const patch: Record<string, unknown> = {};
      if (!existing.assignedRouteId || String(existing.assignedRouteId) !== String(routeId)) patch.assignedRouteId = routeId;
      if (existing.assignedRouteName !== "Ruta QA App") patch.assignedRouteName = "Ruta QA App";
      if (existing.mapsUrl !== input.mapsUrl) patch.mapsUrl = input.mapsUrl;
      if (existing.requiresInvoice !== true) patch.requiresInvoice = true;
      if (existing.creditLimit !== input.creditLimit) patch.creditLimit = input.creditLimit;
      if (existing.creditDays !== input.creditDays) patch.creditDays = input.creditDays;
      if (existing.visitFrequency !== "Semanal") patch.visitFrequency = "Semanal";
      if (existing.stateName !== input.stateName) patch.stateName = input.stateName;
      if (existing.municipalityName !== input.municipalityName) patch.municipalityName = input.municipalityName;
      if (existing.townName !== input.townName) patch.townName = input.townName;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      ids.push(String(existing._id));
      continue;
    }

    const id = await ctx.db.insert("clients", {
      clientType: "commercial",
      commercialName: input.commercialName,
      buyerName: input.buyerName,
      requiresInvoice: true,
      businessName: input.businessName,
      rfc: input.rfc,
      mapsUrl: input.mapsUrl,
      townId: input.townId,
      townName: input.townName,
      municipalityId: input.municipalityId,
      municipalityName: input.municipalityName,
      stateId: input.stateId,
      stateName: input.stateName,
      visitFrequency: "Semanal",
      assignedRouteId: routeId,
      assignedRouteName: "Ruta QA App",
      creditLimit: input.creditLimit,
      creditDays: input.creditDays,
      lat: input.lat,
      lng: input.lng,
      visitOrder: input.visitOrder,
    });
    ids.push(String(id));
  }

  summary.clientIds = ids;
  return ids;
}

async function ensureQaJourney(
  ctx: any,
  summary: Record<string, unknown>,
  profileId: Id<"profiles">,
  bodegaId: Id<"bodegas">
) {
  const date = getOperationalDate();
  const existing = await ctx.db
    .query("journeys")
    .withIndex("by_profile_date", (q: any) => q.eq("profileId", profileId).eq("date", date))
    .first();

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (existing.status !== "active") patch.status = "active";
    if (existing.startKm !== 0) patch.startKm = 0;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
    summary.journeyId = String(existing._id);
    summary.journeyDate = date;
    return existing;
  }

  const id = await ctx.db.insert("journeys", {
    profileId,
    date,
    startKm: 0,
    startLat: 19.2433,
    startLng: -103.7247,
    unit: "QA",
    licensePlate: "QA-APP",
    startTime: Date.now(),
    status: "active",
  });
  summary.journeyId = String(id);
  summary.journeyDate = date;
  return await ctx.db.get(id);
}

async function ensureQaProductsAndInventory(ctx: any, summary: Record<string, unknown>, bodegaId: Id<"bodegas">) {
  const activeProducts = await ctx.db.query("products").collect();
  const usableProducts = activeProducts.filter((product: any) => product.status === "Activo");
  const qaProducts: Array<{ _id: Id<"products">; producto: string }> = [];

  for (const product of usableProducts.slice(0, 25)) {
    qaProducts.push({ _id: product._id, producto: product.producto });
  }

  const ensureProduct = async (sku: string, producto: string, codigo: string) => {
    const existing = await ctx.db.query("products").withIndex("by_sku", (q: any) => q.eq("sku", sku)).first();
    if (existing) {
      const patch: Record<string, unknown> = {};
      if (existing.status !== "Activo") patch.status = "Activo";
      if ((existing.stock ?? 0) !== 10) patch.stock = 10;
      if (existing.lista1 !== "25.00") patch.lista1 = "25.00";
      if (existing.lista2 !== "27.50") patch.lista2 = "27.50";
      if (existing.lista3 !== "30.00") patch.lista3 = "30.00";
      if (existing.lista4 !== "32.50") patch.lista4 = "32.50";
      if (existing.lista5 !== "35.00") patch.lista5 = "35.00";
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return await ctx.db.get(existing._id);
    }
    const category = await ctx.db.query("product_categories").withIndex("by_name", (q: any) => q.eq("name", "QA")).first()
      || await ctx.db.insert("product_categories", { name: "QA" }).then((id: any) => ctx.db.get(id));
    const subcategory = await ctx.db.query("product_subcategories").withIndex("by_category", (q: any) => q.eq("categoryId", category._id)).first()
      || await ctx.db.insert("product_subcategories", { name: "App", categoryId: category._id }).then((id: any) => ctx.db.get(id));
    const id = await ctx.db.insert("products", {
      sku,
      codigo,
      producto,
      cantidadEmpaque: "1",
      categoria: String(category._id),
      subcategoria: String(subcategory._id),
      status: "Activo",
      stock: 10,
      lista1: "25.00",
      lista2: "27.50",
      lista3: "30.00",
      lista4: "32.50",
      lista5: "35.00",
    });
    return await ctx.db.get(id);
  };

  const targetProducts = Array.from({ length: 25 }, (_, index) => {
    const n = index + 1;
    return {
      sku: `QA-APP-${String(n).padStart(3, "0")}`,
      producto: `Producto QA App ${n}`,
      codigo: `QAAPP${String(n).padStart(3, "0")}`,
    };
  });

  for (const product of targetProducts) {
    const existingMatch = qaProducts.find((p) => String(p.producto).toLowerCase() === product.producto.toLowerCase());
    if (existingMatch) continue;
    const created = await ensureProduct(product.sku, product.producto, product.codigo);
    if (created) qaProducts.push({ _id: created._id, producto: created.producto });
  }

  const finalProducts = qaProducts.slice(0, 25);
  const inventoryIds: string[] = [];
  for (const product of finalProducts) {
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_product_bodega", (q: any) => q.eq("productId", product._id).eq("bodegaId", bodegaId))
      .first();
    if (existing) {
      if (existing.quantity !== 10) {
        await ctx.db.patch(existing._id, { quantity: 10 });
      }
      inventoryIds.push(String(existing._id));
      continue;
    }
    const inventoryId = await ctx.db.insert("inventory", {
      productId: product._id,
      bodegaId,
      quantity: 10,
    });
    inventoryIds.push(String(inventoryId));
  }

  summary.productIds = finalProducts.map((p) => String(p._id));
  summary.inventoryIds = inventoryIds;
  return { productIds: summary.productIds, inventoryIds };
}

async function ensureQaHistoricalMovements(
  ctx: any,
  summary: Record<string, unknown>,
  args: {
    bodegaId: Id<"bodegas">;
    profileId: Id<"profiles">;
    routeId: Id<"routes">;
    clientIds: string[];
    productIds: string[];
  }
) {
  const today = getOperationalDate();
  const dates = [0, 1, 2].map((daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return getOperationalDate(d);
  });

  const incomeCategory =
    (await ctx.db.query("bodega_categorias").withIndex("by_type", (q: any) => q.eq("type", "ingreso")).first()) ||
    (await ctx.db.insert("bodega_categorias", { name: "Ventas QA", type: "ingreso", isActive: true }).then((id: any) => ctx.db.get(id)));
  const expenseCategory =
    (await ctx.db.query("bodega_categorias").withIndex("by_type", (q: any) => q.eq("type", "egreso")).first()) ||
    (await ctx.db.insert("bodega_categorias", { name: "Gastos QA", type: "egreso", isActive: true }).then((id: any) => ctx.db.get(id)));

  const existingSales = await ctx.db.query("salidas").collect();
  const existingIncome = await ctx.db.query("bodega_ingresos").collect();
  const existingExpense = await ctx.db.query("bodega_egresos").collect();

  const routeLabel = "Ruta QA App";
  const responsibleName = "Vendedor Demo 1";

  const saleTemplates = [
    { numeroSalida: "QA-SALE-001", fecha: dates[0], totalAmount: 1380, clientIndex: 0 },
    { numeroSalida: "QA-SALE-002", fecha: dates[1], totalAmount: 920, clientIndex: 1 },
    { numeroSalida: "QA-SALE-003", fecha: dates[2], totalAmount: 1760, clientIndex: 2 },
  ];

  for (const sale of saleTemplates) {
    if (existingSales.some((row: any) => row.numeroSalida === sale.numeroSalida)) continue;
    const clientId = args.clientIds[sale.clientIndex] as Id<"clients"> | undefined;
    const productA = args.productIds[0] as Id<"products">;
    const productB = args.productIds[1] as Id<"products">;
    await ctx.db.insert("salidas", {
      numeroSalida: sale.numeroSalida,
      fecha: sale.fecha,
      status: "Entregado",
      responsable: responsibleName,
      tipoEntrega: "route",
      almacen: "Centro de Distribución",
      agente: responsibleName,
      clienteDireccion: "QA",
      totalAmount: sale.totalAmount,
      tipo: "venta",
      serie: "QA",
      clienteCodigo: clientId ? String(clientId) : undefined,
      clienteNombre: clientId ? `Cliente QA ${sale.clientIndex + 1}` : "Cliente QA",
      numeroDocumento: sale.numeroSalida,
      ruta: routeLabel,
      rutaId: args.routeId,
      routeId: args.routeId,
      destino: "QA",
      recipientType: "route",
      shippingMode: "pickup",
      clientId,
      items: [
        {
          productId: productA,
          quantity: 2,
          price: 300,
          subtotal: 600,
          sku: "QA-APP-001",
          descripcion: "Producto QA App 1",
        },
        {
          productId: productB,
          quantity: 3,
          price: 260,
          subtotal: 780,
          sku: "QA-APP-002",
          descripcion: "Producto QA App 2",
        },
      ],
    } as any);
  }

  const incomeTemplates = [
    { folio: "QA-ING-001", date: dates[1], amount: 2500, notes: "Ingreso QA día previo" },
    { folio: "QA-ING-002", date: dates[2], amount: 1800, notes: "Ingreso QA histórico" },
  ];

  for (const income of incomeTemplates) {
    if (existingIncome.some((row: any) => row.folio === income.folio)) continue;
    await ctx.db.insert("bodega_ingresos", {
      bodegaId: args.bodegaId,
      folio: income.folio,
      status: "Aprobado",
      amount: income.amount,
      categoryId: incomeCategory._id,
      date: income.date,
      responsibleId: args.profileId,
      responsibleName,
      responsibleGroup: "Ventas",
      clientName: "Cliente QA",
      notes: income.notes,
    } as any);
  }

  const expenseTemplates = [
    { folio: "QA-EGR-001", date: dates[1], amount: 420, notes: "Gasto QA combustible" },
    { folio: "QA-EGR-002", date: dates[2], amount: 860, notes: "Gasto QA viáticos" },
  ];

  for (const expense of expenseTemplates) {
    if (existingExpense.some((row: any) => row.folio === expense.folio)) continue;
    await ctx.db.insert("bodega_egresos", {
      bodegaId: args.bodegaId,
      folio: expense.folio,
      status: "Aprobado",
      amount: expense.amount,
      categoryId: expenseCategory._id,
      date: expense.date,
      responsibleId: args.profileId,
      responsibleName,
      responsibleGroup: "Ventas",
      provider: "Proveedor QA",
      notes: expense.notes,
    } as any);
  }

  summary.historicalMovements = {
    sales: saleTemplates.map((sale) => sale.numeroSalida),
    incomes: incomeTemplates.map((income) => income.folio),
    expenses: expenseTemplates.map((expense) => expense.folio),
    today,
  };
}

export const seedQaVendorData = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedMaintenanceAccess(ctx);

    const summary: Record<string, unknown> = {
      mode: process.env.CONVEX_DEPLOYMENT || "unknown",
      operationDays: [todayWeekdayCode()],
    };

    const { user, profile } = await ensureQaVendorUserAndProfile(ctx, summary);
    const bodega = await ensureQaVendorBodega(ctx, summary);
    if (!profile || !bodega) {
      throw new Error("No se pudo preparar perfil o bodega QA");
    }

  const bodegaId = bodega._id as Id<"bodegas">;
  const profileId = profile._id as Id<"profiles">;
  const userId = user._id as Id<"users">;

  const nextUserPatch: Record<string, unknown> = {
    profileId,
    allowedWarehouseIds: [bodegaId],
    isActive: true,
  };
  if (String(user.profileId || "") !== String(profileId) || JSON.stringify(user.allowedWarehouseIds || []) !== JSON.stringify([bodegaId])) {
    await ctx.db.patch(userId, nextUserPatch);
  }
  if (String(profile.assignedBodegaId || "") !== String(bodegaId)) {
    await ctx.db.patch(profileId, { assignedBodegaId: bodegaId, workplaceType: "Ruta", status: "Activo", isEmployee: true });
  }

  const route = await ensureQaVendorRoute(ctx, summary, { userId, profileId, bodegaId });
  if (!route) throw new Error("No se pudo preparar la ruta QA");

    const clientIds = await ensureQaClients(ctx, summary, route._id as Id<"routes">);
    const { productIds, inventoryIds } = await ensureQaProductsAndInventory(ctx, summary, bodegaId);
    const journey = await ensureQaJourney(ctx, summary, profileId, bodegaId);

  const refreshedUser = await ctx.db.get(userId);
  const refreshedProfile = await ctx.db.get(profileId);
  const operationalBodegaId = refreshedProfile?.assignedBodegaId || (refreshedUser?.allowedWarehouseIds || [])[0] || null;
  summary.operationalBodegaId = operationalBodegaId ? String(operationalBodegaId) : null;
  summary.journeyActive = Boolean(journey);
  summary.clientIds = clientIds;
  summary.productIds = productIds;
  summary.inventoryIds = inventoryIds;

    console.log("QA vendor seed summary", summary);

    return {
      ok: true,
      ...summary,
    };
  },
});

export const auditDemoAuthAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedMaintenanceAccess(ctx);

    const rows = [];
    for (const target of DEMO_PASSWORD_TARGETS) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", target.email))
        .first();
      const row = await auditPasswordAccountsForEmail(ctx, {
        email: target.email,
        expectedUserId: user?._id,
      });
      rows.push({
        ...row,
        expectedPasswordLabel: target.password,
      });
    }

    return {
      ok: true,
      rows,
      summary: {
        total: rows.length,
        missingAccounts: rows.filter((row) => row.linkStatus === "missing").length,
        invalidLinks: rows.filter((row) => row.linkStatus === "invalid").length,
        duplicateAccounts: rows.reduce((sum, row) => sum + row.duplicatePasswordAccounts, 0),
        duplicateUsers: rows.reduce((sum, row) => sum + row.duplicateUserRows, 0),
      },
    };
  },
});

export const rebuildDemoAuthAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedMaintenanceAccess(ctx);

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

    const results: Array<{
      email: string;
      accountId: string;
      userId: string;
      profileId: string | null;
      roleId: string | null;
      accountStatus: "existing" | "created" | "rebuilt";
    }> = [];

    for (const target of DEMO_PASSWORD_TARGETS) {
      const roleId = roleByName.get(target.roleName) as Id<"roles"> | undefined;
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", target.email))
        .first();

      if (!user) {
        const userId = await ctx.db.insert("users", {
          name: target.name,
          email: target.email,
          role: target.roleString,
          roleId,
          isActive: true,
          allowedWarehouseIds: [],
        });
        user = await ctx.db.get(userId);
      } else {
        await ctx.db.patch(user._id, {
          name: target.name,
          role: target.roleString,
          roleId,
          isActive: true,
          allowedWarehouseIds: target.roleName === "Bodeguero" ? (user.allowedWarehouseIds || []) : [],
        });
        user = await ctx.db.get(user._id);
      }

      if (!user) {
        continue;
      }

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      let profileId = profile?._id ? String(profile._id) : null;
      if (profile) {
        if (profile.fullName !== target.name || profile.status !== "Activo" || profile.isEmployee !== true || profile.group !== target.group) {
          await ctx.db.patch(profile._id, {
            fullName: target.name,
            status: "Activo",
            isEmployee: true,
            group: target.group,
          });
        }
      } else {
        const createdProfileId = await ctx.db.insert("profiles", {
          userId: user._id,
          fullName: target.name,
          status: "Activo",
          isEmployee: true,
          group: target.group,
        });
        profileId = String(createdProfileId);
      }

      if (profileId && String(user.profileId || "") !== profileId) {
        await ctx.db.patch(user._id, { profileId: profileId as Id<"profiles"> });
      }

      const repair = await ensurePasswordAccountForUser(ctx, {
        userId: user._id,
        email: target.email,
        password: target.password,
      });

      results.push({
        email: target.email,
        accountId: repair.accountId,
        userId: String(user._id),
        profileId,
        roleId: roleId ? String(roleId) : null,
        accountStatus: repair.status,
      });
    }

    return {
      ok: true,
      results,
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

export const assignWarehouseCodes = mutation({
  args: {},
  handler: async (ctx) => {
    await assertProdMaintenanceAccess(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    const ordered = [...bodegas].sort((a, b) => a._creationTime - b._creationTime);
    let patched = 0;
    for (let i = 0; i < ordered.length; i++) {
      const bodega = ordered[i];
      if ((bodega as any).code) continue;
      const code = numberToWarehouseCode(i + 1);
      await ctx.db.patch(bodega._id, { code });
      patched++;
    }
    return { ok: true, patched, total: ordered.length };
  },
});

export const ensureWarehouseMovementSequences = mutation({
  args: {},
  handler: async (ctx) => {
    await assertProdMaintenanceAccess(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    for (const bodega of bodegas) {
      await ensureWarehouseMovementSequence(ctx, bodega._id, "entrada");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "salida");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "ingreso");
      await ensureWarehouseMovementSequence(ctx, bodega._id, "egreso");
    }
    return { ok: true, bodegas: bodegas.length };
  },
});

async function resolveResponsible(ctx: any, profileId?: any, userId?: any) {
  const profile = profileId ? await ctx.db.get(profileId) : null;
  const user = userId ? await ctx.db.get(userId) : null;
  const userProfile = user?.profileId ? await ctx.db.get(user.profileId) : null;
  return {
    responsibleProfileId: profile?._id || userProfile?._id,
    responsibleUserId: user?._id,
    responsibleName: profile?.fullName || userProfile?.fullName || user?.name || user?.email || undefined,
  };
}

async function upsertSystemLinkedAccount(
  ctx: any,
  args: {
    linkedEntityType: "bodega" | "route";
    linkedEntityId: string;
    alias: string;
    responsibleProfileId?: Id<"profiles">;
    responsibleUserId?: Id<"users">;
    isActive?: boolean;
  }
) {
  const existing = await ctx.db
    .query("finance_accounts")
    .withIndex("by_linked_entity", (q: any) =>
      q.eq("linkedEntityType", args.linkedEntityType).eq("linkedEntityId", args.linkedEntityId)
    )
    .first();

  const responsible = await resolveResponsible(ctx, args.responsibleProfileId, args.responsibleUserId);
  const payload = {
    alias: args.alias,
    type: "Caja Chica" as const,
    currency: "MXN",
    isActive: args.isActive ?? true,
    linkedEntityType: args.linkedEntityType,
    linkedEntityId: args.linkedEntityId,
    isSystemLinked: true,
    ...responsible,
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return await ctx.db.insert("finance_accounts", {
    ...payload,
    initialBalance: 0,
    currentBalance: 0,
  });
}

export const ensureLinkedAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    await assertProdMaintenanceAccess(ctx);
    const bodegas = await ctx.db.query("bodegas").collect();
    const routes = await ctx.db.query("routes").collect();

    let createdOrUpdated = 0;
    for (const bodega of bodegas) {
      await upsertSystemLinkedAccount(ctx, {
        linkedEntityType: "bodega",
        linkedEntityId: String(bodega._id),
        alias: `Caja de ${bodega.name}`,
        responsibleProfileId: (bodega as any).managerProfileId,
        responsibleUserId: (bodega as any).managerUserId,
        isActive: bodega.isActive,
      });
      createdOrUpdated++;
    }

    for (const route of routes) {
      await upsertSystemLinkedAccount(ctx, {
        linkedEntityType: "route",
        linkedEntityId: String(route._id),
        alias: `Caja de ${route.name}`,
        responsibleProfileId: route.assignedProfileId,
        responsibleUserId: route.assignedUserId,
        isActive: route.isActive,
      });
      createdOrUpdated++;
    }

    const allAccounts = await ctx.db.query("finance_accounts").collect();
    for (const account of allAccounts) {
      if (!account.linkedEntityType) {
        await ctx.db.patch(account._id, {
          linkedEntityType: "manual",
          isSystemLinked: false,
        });
      }
    }

    return { ok: true, createdOrUpdated };
  },
});
