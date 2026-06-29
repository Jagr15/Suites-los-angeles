import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

type SalidaRow = Doc<"salidas">;
type NullableDoc<T> = T | null;

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number) {
  const next = new Date(`${dateKey}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function startOfMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function addMonths(monthKey: string, months: number) {
  const next = new Date(`${monthKey}-01T00:00:00.000Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

async function loadClientAndRouteLookup(ctx: QueryCtx, salidas: SalidaRow[]) {
  const clientIds = new Set<Id<"clients">>();
  const routeIds = new Set<Id<"routes">>();

  for (const salida of salidas) {
    if (salida.clientId) clientIds.add(salida.clientId);
    if (salida.rutaId) routeIds.add(salida.rutaId as Id<"routes">);
    if (salida.routeId) routeIds.add(salida.routeId as Id<"routes">);
  }

  const [clients, routes] = await Promise.all([
    Promise.all(Array.from(clientIds).map((id) => ctx.db.get(id))),
    Promise.all(Array.from(routeIds).map((id) => ctx.db.get(id))),
  ]);

  const clientById = new Map<string, NonNullable<NullableDoc<Doc<"clients">>>>();
  for (const client of clients) {
    if (client) clientById.set(String(client._id), client);
  }

  const routeById = new Map<string, NonNullable<NullableDoc<Doc<"routes">>>>();
  const routeByName = new Map<string, NonNullable<NullableDoc<Doc<"routes">>>>();
  for (const route of routes) {
    if (!route) continue;
    routeById.set(String(route._id), route);
    routeByName.set(String(route.name || "").trim().toLowerCase(), route);
  }

  return { clientById, routeById, routeByName };
}

function resolveDestinatario(salida: SalidaRow, client: NullableDoc<Doc<"clients">>, route: NullableDoc<Doc<"routes">>) {
  if (String(salida.recipientType || "") === "route" || route) {
    return route?.name || salida.ruta || salida.destino || "Ruta interna";
  }

  if (client) {
    return client.commercialName || client.buyerName || "Cliente mayorista";
  }

  return salida.destino || salida.clienteNombre || "Destinatario no definido";
}

export const list = query({
  args: { bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
    if (args.bodegaId) {
      return await ctx.db
        .query("salidas")
        .withIndex("by_bodegaId", (q) => q.eq("bodegaId", args.bodegaId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("salidas").order("desc").collect();
  },
});

export const listRecent = query({
  args: {
    bodegaId: v.optional(v.id("bodegas")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = Math.max(1, Math.min(args.limit ?? 6, 25));
      const salidas = args.bodegaId
        ? await ctx.db
            .query("salidas")
            .withIndex("by_bodegaId_fecha", (q) => q.eq("bodegaId", args.bodegaId!))
            .order("desc")
            .take(limit)
        : await ctx.db.query("salidas").withIndex("by_fecha", (q) => q.gte("fecha", "")).order("desc").take(limit);

      const { clientById, routeById, routeByName } = await loadClientAndRouteLookup(ctx, salidas);

      return salidas.map((salida) => {
        const client = salida.clientId ? clientById.get(String(salida.clientId)) ?? null : null;
        const route =
          (salida.rutaId ? routeById.get(String(salida.rutaId)) ?? null : null) ||
          (salida.routeId ? routeById.get(String(salida.routeId)) ?? null : null) ||
          (salida.ruta ? routeByName.get(String(salida.ruta).trim().toLowerCase()) ?? null : null);

        return {
          ...salida,
          totalAmount: Number.isFinite(Number(salida.totalAmount)) ? Number(salida.totalAmount) : 0,
          destinatario: resolveDestinatario(salida, client, route),
        };
      });
    } catch (error) {
      console.error("salidas.listRecent failed", {
        bodegaId: args.bodegaId ? String(args.bodegaId) : null,
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  },
});

export const summary = query({
  args: { bodegaId: v.optional(v.id("bodegas")) },
  handler: async (ctx, args) => {
    try {
      const now = new Date();
      const today = getDateKey(now);
      const monthStartKey = startOfMonthKey(now);
      const nextDay = addDays(today, 1);
      const nextMonth = addMonths(monthStartKey, 1);

      const todayRows = args.bodegaId
        ? await ctx.db
            .query("salidas")
            .withIndex("by_bodegaId_fecha", (q) => q.eq("bodegaId", args.bodegaId!).gte("fecha", today).lt("fecha", nextDay))
            .collect()
        : await ctx.db.query("salidas").withIndex("by_fecha", (q) => q.gte("fecha", today).lt("fecha", nextDay)).collect();

      const monthRows = args.bodegaId
        ? await ctx.db
            .query("salidas")
            .withIndex("by_bodegaId_fecha", (q) => q.eq("bodegaId", args.bodegaId!).gte("fecha", monthStartKey).lt("fecha", nextMonth))
            .collect()
        : await ctx.db.query("salidas").withIndex("by_fecha", (q) => q.gte("fecha", monthStartKey).lt("fecha", nextMonth)).collect();

      const todayTotal = todayRows.reduce((acc, row) => acc + Number(row.totalAmount || 0), 0);
      const monthTotal = monthRows.reduce((acc, row) => acc + Number(row.totalAmount || 0), 0);
      const monthCount = monthRows.length;
      const recent = [...todayRows]
        .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
        .slice(0, 6);

      return {
        totalSalidas: monthCount,
        totalAmount: Number.isFinite(monthTotal) ? monthTotal : 0,
        count: monthCount,
        recent,
        items: recent,
        todayTotal: Number.isFinite(todayTotal) ? todayTotal : 0,
        todayCount: todayRows.length,
        monthTotal: Number.isFinite(monthTotal) ? monthTotal : 0,
        monthCount,
        averageTicket: monthCount > 0 && Number.isFinite(monthTotal) ? monthTotal / monthCount : 0,
        hasTodayData: todayRows.length > 0,
        hasMonthData: monthCount > 0,
      };
    } catch (error) {
      console.error("salidas.summary failed", {
        bodegaId: args.bodegaId ? String(args.bodegaId) : null,
        error: error instanceof Error ? error.message : error,
      });
      return {
        totalSalidas: 0,
        totalAmount: 0,
        count: 0,
        recent: [],
        items: [],
        todayTotal: 0,
        todayCount: 0,
        monthTotal: 0,
        monthCount: 0,
        averageTicket: 0,
        hasTodayData: false,
        hasMonthData: false,
      };
    }
  },
});
