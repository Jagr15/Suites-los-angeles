"use client";

import { Card, CardBody } from "@heroui/react";
import { CartIcon, Server, TagUser } from "@heroui/shared-icons";

const balanceCards = [
  {
    title: "Ventas hoy",
    subtitle: "156 transacciones",
    value: "$ 24,580",
    trend: "+4.5%",
    trendUp: true,
    metrics: ["$ 22,100 ayer", "$ 18,200 semana pasada", "42 ventas VIP"],
    color: "primary",
    icon: CartIcon,
  },
  {
    title: "Ventas del mes",
    subtitle: "+12% vs mes anterior",
    value: "$ 312,450",
    trend: "+4.5%",
    trendUp: false,
    metrics: ["$ 298,200 anterior", "1,240 transacciones"],
    color: "default",
    icon: Server,
  },
  {
    title: "Ticket promedio",
    subtitle: "Por transacción",
    value: "$ 157",
    trend: "-2.1%",
    trendUp: false,
    metrics: ["$ 162 mes anterior", "Top: $ 1,250"],
    color: "success",
    icon: TagUser,
  },
];

export function DashboardStats() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Balance disponible</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balanceCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`border border-default-200 ${
                card.color === "primary"
                  ? "bg-primary/5 border-primary/20"
                  : card.color === "success"
                    ? "bg-success/5 border-success/20"
                    : "bg-default-50"
              }`}
            >
              <CardBody className="gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        card.color === "primary"
                          ? "bg-primary/20 text-primary"
                          : card.color === "success"
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
                  <span
                    className={`text-tiny font-medium ${
                      card.trendUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {card.trend}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-tiny text-default-500">
                  {card.metrics.map((m, i) => (
                    <span key={i}>{m}</span>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
