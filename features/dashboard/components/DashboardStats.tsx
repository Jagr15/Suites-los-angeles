"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Card, CardBody, Chip } from "@heroui/react";
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWarehouse } from "@/shared/context/warehouse-context";

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

type SalidaSummary = {
  fecha?: string;
  totalAmount?: number;
};

function MetricSkeleton() {
  return (
    <Card className="border border-default-200 bg-content1">
      <CardBody className="gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-default-200/80 animate-pulse" />
            <div className="h-3 w-32 rounded bg-default-200/60 animate-pulse" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-default-200/80 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded bg-default-200/70 animate-pulse" />
        <div className="h-3 w-full rounded bg-default-200/60 animate-pulse" />
      </CardBody>
    </Card>
  );
}

export function DashboardStats() {
  const { selectedWarehouseId } = useWarehouse();
  const salidas = useQuery(
    api.salidas.queries.list,
    selectedWarehouseId ? { bodegaId: selectedWarehouseId as Id<"bodegas"> } : {}
  ) as SalidaSummary[] | undefined;

  const metrics = useMemo(() => {
    const rows = salidas ?? [];
    const todayKey = getLocalDateKey();
    const monthKey = getMonthKey();

    const todayRows = rows.filter((row) => String(row.fecha || "").startsWith(todayKey));
    const monthRows = rows.filter((row) => String(row.fecha || "").startsWith(monthKey));

    const todayTotal = todayRows.reduce((acc: number, row) => acc + Number(row.totalAmount || 0), 0);
    const monthTotal = monthRows.reduce((acc: number, row) => acc + Number(row.totalAmount || 0), 0);
    const todayCount = todayRows.length;
    const monthCount = monthRows.length;
    const averageTicket = monthCount > 0 ? monthTotal / monthCount : 0;

    return {
      todayTotal,
      todayCount,
      monthTotal,
      monthCount,
      averageTicket,
      hasTodayData: todayCount > 0,
      hasMonthData: monthCount > 0,
    };
  }, [salidas]);

  if (salidas === undefined) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumen operativo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Salidas hoy",
      subtitle: metrics.hasTodayData ? `${metrics.todayCount} operaciones del día` : "No hay salidas registradas hoy",
      value: formatMoney(metrics.todayTotal),
      helper: `Total real del día`,
      icon: CurrencyDollarIcon,
      tone: "primary" as const,
    },
    {
      title: "Salidas del mes",
      subtitle: metrics.hasMonthData ? `${metrics.monthCount} operaciones del mes` : "Sin movimientos en el mes",
      value: formatMoney(metrics.monthTotal),
      helper: `Consolidado mensual`,
      icon: ShoppingCartIcon,
      tone: "default" as const,
    },
    {
      title: "Ticket promedio",
      subtitle: metrics.hasMonthData ? "Promedio sobre operaciones del mes" : "Sin operaciones para calcular promedio",
      value: formatMoney(metrics.averageTicket),
      helper: `${metrics.monthCount} movimientos base`,
      icon: CalculatorIcon,
      tone: "success" as const,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Resumen operativo</h2>
        <Chip size="sm" variant="flat" color="primary">
          MXN
        </Chip>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`border border-default-200 ${
                card.tone === "primary"
                  ? "bg-primary/5 border-primary/20"
                  : card.tone === "success"
                    ? "bg-success/5 border-success/20"
                    : "bg-default-50"
              }`}
            >
              <CardBody className="gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        card.tone === "primary"
                          ? "bg-primary/20 text-primary"
                          : card.tone === "success"
                            ? "bg-success/20 text-success"
                            : "bg-default-200 text-default-600"
                      }`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{card.title}</p>
                      <p className="text-tiny text-default-500">{card.subtitle}</p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <div className="text-tiny text-default-500">{card.helper}</div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
