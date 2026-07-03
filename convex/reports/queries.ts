import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDailySummary = query({
  args: { date: v.string(), profileId: v.optional(v.id("profiles")), bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("salidas").withIndex("by_fecha", (q) => q.eq("fecha", args.date)).filter((q) => q.eq(q.field("tipo"), "venta")).collect();
    const payments = await ctx.db.query("payments").withIndex("by_date", (q) => q.eq("date", args.date)).collect();
    const paymentsBySalida = new Map<string, typeof payments>();
    for (const payment of payments) {
      if (!payment.salidaId) continue;
      const key = String(payment.salidaId);
      const current = paymentsBySalida.get(key) ?? [];
      current.push(payment);
      paymentsBySalida.set(key, current);
    }
    const filteredSales = sales.filter((sale) => !args.bodegaId || sale.bodegaId === args.bodegaId);
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const cashSales = filteredSales.reduce((sum, sale) => {
      const salePayments = paymentsBySalida.get(String(sale._id)) ?? [];
      const hasCashPayment = salePayments.some((payment) => payment.method === "cash" || payment.method === "transfer");
      return sum + (hasCashPayment ? sale.totalAmount : 0);
    }, 0);
    const creditSales = Math.max(totalSales - cashSales, 0);
    return { sales: filteredSales, totalSales, cashSales, creditSales, count: filteredSales.length, paymentsTotal: payments.reduce((s, p) => s + p.amount, 0) };
  },
});

export const getDailyProductSales = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const salidas = await ctx.db.query("salidas").withIndex("by_fecha", (q) => q.eq("fecha", args.date)).filter((q) => q.eq(q.field("tipo"), "venta")).collect();
    const items = salidas.flatMap((sale) => (sale.items ?? []).map((item) => ({ ...item, sale })));
    const aggregated = new Map<string, { productId: string; name: string | null; quantity: number; total: number }>();
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      const key = String(item.productId);
      const current = aggregated.get(key) ?? { productId: key, name: product?.producto ?? null, quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += item.subtotal ?? item.price * item.quantity;
      aggregated.set(key, current);
    }
    return Array.from(aggregated.values()).sort((a, b) => b.total - a.total);
  },
});
