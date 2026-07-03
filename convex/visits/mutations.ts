import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getOperationalDate } from "../shared/operationalDate";

export const recordVisit = mutation({
  args: {
    salidaId: v.optional(v.id("salidas")),
    clientId: v.id("clients"),
    routeId: v.id("routes"),
    profileId: v.id("profiles"),
    type: v.union(v.literal("sale"), v.literal("check-in"), v.literal("no-sale")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getOperationalDate();
    return await ctx.db.insert("visits", { ...args, date, timestamp: Date.now() });
  },
});
