"use client";

import { useQuery } from "convex/react";
import { Card, CardBody, Chip } from "@heroui/react";
import { CurrencyDollarIcon, ShoppingCartIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWarehouse } from "@/shared/context/warehouse-context";

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

type DashboardSummary = {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  averageTicket: number;
  hasTodayData: boolean;
  hasMonthData: boolean;
};

function MetricSkeleton() {
  return (
    <Card className="border border-default-200 bg-content1">
      <CardBody className="gap-3 p-4 sm:p-5">
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
  const summary = useQuery(
    api.salidas.queries.summary,
    selectedWarehouseId ? { bodegaId: selectedWarehouseId as Id<"bodegas"> } : {}
  ) as DashboardSummary | undefined;

  if (summary === undefined) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumen operativo</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      subtitle: summary.hasTodayData ? `${summary.todayCount} operaciones del día` : "No hay salidas registradas hoy",
      value: formatMoney(summary.todayTotal),
      helper: "Total real del día",
      icon: CurrencyDollarIcon,
      tone: "primary" as const,
    },
    {
      title: "Salidas del mes",
      subtitle: summary.hasMonthData ? `${summary.monthCount} operaciones del mes` : "Sin movimientos en el mes",
      value: formatMoney(summary.monthTotal),
      helper: "Consolidado mensual",
      icon: ShoppingCartIcon,
      tone: "default" as const,
    },
    {
      title: "Ticket promedio",
      subtitle: summary.hasMonthData ? "Promedio sobre operaciones del mes" : "Sin operaciones para calcular promedio",
      value: formatMoney(summary.averageTicket),
      helper: `${summary.monthCount} movimientos base`,
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`h-full border border-default-200 ${
                card.tone === "primary"
                  ? "bg-primary/5 border-primary/20"
                  : card.tone === "success"
                    ? "bg-success/5 border-success/20"
                    : "bg-default-50"
              }`}
            >
              <CardBody className="gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        card.tone === "primary"
                          ? "bg-primary/20 text-primary"
                          : card.tone === "success"
                            ? "bg-success/20 text-success"
                            : "bg-default-200 text-default-600"
                      }`}
                    >
                      <Icon className="size-4 sm:size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{card.title}</p>
                      <p className="max-h-9 overflow-hidden text-tiny leading-snug text-default-500">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold leading-none text-foreground sm:text-[2rem]">{card.value}</p>
                <div className="text-tiny text-default-500">{card.helper}</div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
