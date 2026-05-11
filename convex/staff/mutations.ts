import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

/**
 * Crea un nuevo empleado completo (User + Profile).
 * Solo puede ser ejecutado por un Admin.
 */
export const createStaff = mutation({
  args: {
    // Datos del Usuario
    name: v.string(),
    email: v.string(),
    roleId: v.optional(v.id("roles")),
    phone: v.optional(v.string()),
    
    // Datos del Perfil (RRHH)
    fullName: v.string(),
    rfc: v.optional(v.string()),
    curp: v.optional(v.string()),
    nss: v.optional(v.string()),
    position: v.optional(v.string()),
    baseSalary: v.optional(v.number()),
    status: v.union(v.literal("Activo"), v.literal("Inactivo")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // 1. Verificar si el email ya existe
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    
    if (existing) {
      throw new Error("El correo electrónico ya está registrado");
    }

    // 2. Crear el registro en 'users'
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      roleId: args.roleId,
      phone: args.phone,
      isActive: args.status === "Activo",
    });

    // 3. Crear el registro en 'profiles' vinculado al userId
    const profileId = await ctx.db.insert("profiles", {
      userId,
      fullName: args.fullName,
      rfc: args.rfc,
      curp: args.curp,
      nss: args.nss,
      position: args.position,
      baseSalary: args.baseSalary,
      status: args.status,
    });

    return { userId, profileId };
  },
});

/**
 * Actualiza la información de un empleado existente.
 */
export const updateStaff = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    email: v.optional(v.string()),
    // Perfil
    fullName: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Activo"), v.literal("Inactivo"))),
    baseSalary: v.optional(v.number()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { userId, ...updates } = args;

    // Actualizar User
    await ctx.db.patch(userId, {
      ...(updates.name && { name: updates.name }),
      ...(updates.roleId && { roleId: updates.roleId }),
      ...(updates.email && { email: updates.email }),
      ...(updates.status && { isActive: updates.status === "Activo" }),
    });

    // Buscar y actualizar Perfil
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        ...(updates.fullName && { fullName: updates.fullName }),
        ...(updates.status && { status: updates.status }),
        ...(updates.baseSalary && { baseSalary: updates.baseSalary }),
        ...(updates.position && { position: updates.position }),
      });
    }
  },
});
