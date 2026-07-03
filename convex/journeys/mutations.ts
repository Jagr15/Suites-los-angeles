import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const start = mutation({
  args: {
    profileId: v.id("profiles"),
    date: v.string(),
    startKm: v.number(),
    startLat: v.optional(v.number()),
    startLng: v.optional(v.number()),
    unit: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("journeys").withIndex("by_profile_date", (q) => q.eq("profileId", args.profileId).eq("date", args.date)).filter((q) => q.eq(q.field("status"), "active")).first();
    if (existing) return existing._id;
    return await ctx.db.insert("journeys", { ...args, startTime: Date.now(), status: "active" });
  },
});

export const complete = mutation({
  args: { id: v.id("journeys"), endKm: v.number(), endLat: v.optional(v.number()), endLng: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.id);
    if (!journey) throw new Error("Jornada no encontrada");
    if (args.endKm < journey.startKm) throw new Error("El kilometraje final no puede ser menor al inicial");
    await ctx.db.patch(args.id, { endKm: args.endKm, endLat: args.endLat, endLng: args.endLng, endTime: Date.now(), status: "completed" });
    return args.id;
  },
});
