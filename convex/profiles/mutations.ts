import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";

const profileFields = {
  fullName: v.string(),
  rfc: v.optional(v.string()),
  curp: v.optional(v.string()),
  nss: v.optional(v.string()),
  personalPhone: v.optional(v.string()),
  emergencyPhone: v.optional(v.string()),
  bloodType: v.optional(v.string()),
  hireDate: v.optional(v.string()),
  position: v.optional(v.string()),
  baseSalary: v.optional(v.number()),
  status: v.union(v.literal("Activo"), v.literal("Inactivo")),
  isEmployee: v.boolean(),
  // Campos de horario y operativos
  workStart: v.optional(v.string()),
  workEnd: v.optional(v.string()),
  workDays: v.optional(v.array(v.string())),
  group: v.optional(v.union(
    v.literal("Administración"),
    v.literal("Ventas"),
    v.literal("Bodega"),
    v.literal("Sistemas")
  )),
  workplaceType: v.optional(v.union(
    v.literal("Casa"), 
    v.literal("Bodega"), 
    v.literal("Ruta"), 
    v.literal("Ventas")
  )),
  assignedBodegaId: v.optional(v.id("bodegas")),
  image: v.optional(v.string()),
};

/**
 * Crea un nuevo perfil.
 */
export const create = mutation({
  args: profileFields,
  handler: async (ctx, args) => {
    // await requireAdmin(ctx);
    return await ctx.db.insert("profiles", args);
  },
});

/**
 * Actualiza un perfil existente.
 */
export const update = mutation({
  args: {
    id: v.id("profiles"),
    ...Object.fromEntries(
      Object.entries(profileFields).map(([k, v]) => [k, v])
    ),
  },
  handler: async (ctx, args) => {
    // await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

/**
 * Cambia el estado de un perfil a Inactivo (Soft delete).
 */
export const remove = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    // await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "Inactivo" });
  },
});
