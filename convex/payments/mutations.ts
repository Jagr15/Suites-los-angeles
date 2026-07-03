import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOperationalDate } from "../shared/operationalDate";
import { isAdmin, getCurrentUserWithRole } from "../common/utils";

export const registerPayment = mutation({
  args: {
    salidaId: v.optional(v.id("salidas")),
    clientId: v.id("clients"),
    profileId: v.id("profiles"),
    routeId: v.optional(v.id("routes")),
    amount: v.number(),
    method: v.union(v.literal("cash"), v.literal("transfer")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const current = await getCurrentUserWithRole(ctx);
    if (!current) throw new Error("No autenticado");
    if (!(await isAdmin(ctx)) && !current.user.role?.toLowerCase().includes("vendedor") && !current.user.role?.toLowerCase().includes("ventas") && !current.user.role?.toLowerCase().includes("ruta")) {
      throw new Error("Acceso denegado: no tienes permisos para registrar cobros");
    }
    if (current.user.profileId && args.profileId !== current.user.profileId && !(await isAdmin(ctx))) {
      throw new Error("Acceso denegado: no puedes registrar cobros para otro perfil");
    }
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Cliente inválido");
    const paymentId = await ctx.db.insert("payments", {
      ...args,
      amount: args.amount,
      date: getOperationalDate(),
      timestamp: Date.now(),
    });
    await ctx.db.patch(args.clientId, { balance: (client.balance ?? 0) - args.amount });
    return paymentId;
  },
});
