"use client";

import { useMemo, useState } from "react";
import { Input, Chip } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { mockRutasGastos as mockData } from "@/shared/mocks/rutasGastos";
import type { Route } from "@/features/configuracion/components/routes/types";

const FIELD_ORDER = ["manzanillo", "colima", "nayarit", "laPaz", "jalisco", "cdConstitucion"] as const;
type RouteField = (typeof FIELD_ORDER)[number];

const FIELD_LABELS: Record<RouteField, string> = {
  manzanillo: "Manzanillo",
  colima: "Colima",
  nayarit: "Nayarit",
  laPaz: "La Paz",
  jalisco: "Jalisco",
  cdConstitucion: "Cd Constitución",
};

const DESTINATION_TO_FIELD: Record<string, RouteField> = {
  manzanillo: "manzanillo",
  colima: "colima",
  nayarit: "nayarit",
  tepic: "nayarit",
  "la paz": "laPaz",
  lapaz: "laPaz",
  jalisco: "jalisco",
  vallarta: "jalisco",
  "puerto vallarta": "jalisco",
  centro: "cdConstitucion",
  tecoman: "cdConstitucion",
  "tecomán": "cdConstitucion",
  "villa de alvarez": "cdConstitucion",
  "villa de álvarez": "cdConstitucion",
  constitucion: "cdConstitucion",
  "cd constitucion": "cdConstitucion",
  "cd constitución": "cdConstitucion",
};

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function pickRouteField(route: Route): RouteField | null {
  const destination = normalizeText(route.destination);
  const name = normalizeText(route.name);
  return DESTINATION_TO_FIELD[destination] || DESTINATION_TO_FIELD[name] || null;
}

function formatCurrency(value: number) {
  if (value <= 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function RutasGastos({ selectedRoute, allRoutes }: { selectedRoute: Route; allRoutes: Route[] }) {
  const [search, setSearch] = useState("");
  const selectedField = useMemo(() => pickRouteField(selectedRoute), [selectedRoute]);

  const visibleFields = useMemo(() => {
    const unique = new Map<RouteField, string>();
    for (const route of allRoutes) {
      const field = pickRouteField(route);
      if (!field || unique.has(field)) continue;
      unique.set(field, FIELD_LABELS[field]);
    }
    const ordered = FIELD_ORDER.filter((field) => unique.has(field)).map((field) => ({
      field,
      label: unique.get(field) || FIELD_LABELS[field],
    }));
    return ordered.length > 0
      ? ordered
      : FIELD_ORDER.map((field) => ({ field, label: FIELD_LABELS[field] }));
  }, [allRoutes]);

  const filteredItems = useMemo(() => {
    const q = normalizeText(search);
    if (!q) return mockData;
    return mockData.filter((item) => normalizeText(item.categoria).includes(q));
  }, [search]);

  const rows = useMemo(() => {
    return filteredItems.map((item) => {
      const byField = visibleFields.map(({ field }) => ({
        field,
        amount: Number(item[field] || 0),
      }));
      const total = byField.reduce((acc, entry) => acc + entry.amount, 0);
      const routesWithExpense = byField.filter((entry) => entry.amount > 0).length;
      const promedio = routesWithExpense > 0 ? total / routesWithExpense : 0;
      const pctOfGeneral = 0;
      return {
        id: item.id,
        categoria: item.categoria,
        total,
        promedio,
        pctOfGeneral,
        byField,
      };
    });
  }, [filteredItems, visibleFields]);

  const totals = useMemo(() => {
    const totalGeneral = rows.reduce((acc, row) => acc + row.total, 0);
    const rowsWithExpense = rows.filter((row) => row.total > 0).length;
    const promedioGeneral = rowsWithExpense > 0 ? totalGeneral / rowsWithExpense : 0;
    const totalsByField = visibleFields.map(({ field }) => ({
      field,
      total: rows.reduce((acc, row) => acc + (row.byField.find((entry) => entry.field === field)?.amount || 0), 0),
    }));
    return { totalGeneral, promedioGeneral, totalsByField };
  }, [rows, visibleFields]);

  const computedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      pctOfGeneral: totals.totalGeneral > 0 ? (row.total / totals.totalGeneral) * 100 : 0,
    }));
  }, [rows, totals.totalGeneral]);

  const hasData = totals.totalGeneral > 0;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
          className="max-w-sm"
          variant="bordered"
          radius="lg"
        />
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-default-200 bg-default-50 px-4 py-3 text-sm font-medium text-default-600">
          Sin gastos registrados para esta ruta.
        </div>
      ) : (
        <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-4 text-left border-b border-default-100">Categoría</th>
                  <th className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-4 text-center border-b border-default-100">Total</th>
                  <th className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-4 text-center border-b border-default-100">Promedio</th>
                  <th className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-4 text-center border-b border-default-100">%</th>
                  {visibleFields.map(({ field, label }) => (
                    <th key={field} className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-4 text-center border-b border-default-100">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computedRows.map((row) => (
                  <tr key={row.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground border-b border-default-100">{row.categoria}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-default-900 border-b border-default-100">{formatCurrency(row.total)}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-default-700 border-b border-default-100">{formatCurrency(row.promedio)}</td>
                    <td className="px-4 py-3 text-center border-b border-default-100">
                      <Chip size="sm" variant="flat" color="primary" className="text-[10px] font-bold">
                        {formatPercent(row.pctOfGeneral)}
                      </Chip>
                    </td>
                    {visibleFields.map(({ field }) => {
                      const amount = row.byField.find((entry) => entry.field === field)?.amount || 0;
                      const routePct = row.total > 0 ? (amount / row.total) * 100 : 0;
                      return (
                        <td key={field} className="px-4 py-3 text-center border-b border-default-100">
                          {amount > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-sm font-semibold ${selectedField === field ? "text-primary" : "text-default-700"}`}>
                                {formatCurrency(amount)}
                              </span>
                              <Chip size="sm" variant="flat" className="text-[10px] font-bold text-primary">
                                {formatPercent(routePct)}
                              </Chip>
                            </div>
                          ) : (
                            <span className="text-sm text-default-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="bg-primary/5">
                  <td className="px-4 py-3 text-sm font-bold text-primary border-t border-primary/20">TOTAL GENERAL</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-primary border-t border-primary/20">{formatCurrency(totals.totalGeneral)}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-primary border-t border-primary/20">{formatCurrency(totals.promedioGeneral)}</td>
                  <td className="px-4 py-3 text-center border-t border-primary/20">
                    <Chip size="sm" variant="flat" color="primary" className="text-[10px] font-bold">
                      100%
                    </Chip>
                  </td>
                  {visibleFields.map(({ field }) => {
                    const routeTotal = totals.totalsByField.find((entry) => entry.field === field)?.total || 0;
                    const routePct = totals.totalGeneral > 0 ? (routeTotal / totals.totalGeneral) * 100 : 0;
                    return (
                      <td key={field} className="px-4 py-3 text-center border-t border-primary/20">
                        {routeTotal > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${selectedField === field ? "text-primary" : "text-default-700"}`}>
                              {formatCurrency(routeTotal)}
                            </span>
                            <Chip size="sm" variant="flat" className="text-[10px] font-bold text-primary">
                              {formatPercent(routePct)}
                            </Chip>
                          </div>
                        ) : (
                          <span className="text-sm text-default-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
