import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOperationalDate } from "../shared/operationalDate";

export const listDailyByRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const today = getOperationalDate();
    return await ctx.db.query("visits").withIndex("by_route_date", (q) => q.eq("routeId", args.routeId).eq("date", today)).collect();
  },
});

export const getByClientToday = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const today = getOperationalDate();
    return await ctx.db.query("visits").withIndex("by_client_date", (q) => q.eq("clientId", args.clientId).eq("date", today)).first();
  },
});
