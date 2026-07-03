import { query } from "../_generated/server";
import { v } from "convex/values";

export const listDailyWithClients = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();
    return Promise.all(payments.map(async (payment) => ({
      ...payment,
      clientName: (await ctx.db.get(payment.clientId))?.commercialName ?? "Cliente desconocido",
    })));
  },
});

export const dailyTotal = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    return payments.reduce((sum, item) => sum + item.amount, 0);
  },
});
