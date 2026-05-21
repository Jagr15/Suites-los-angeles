"use client";

import { Tabs, Tab } from "@heroui/react";

const tabs = [
  { key: "ventas", label: "Ventas" },
  { key: "cuentas-por-pagar", label: "Cuentas por pagar" },
  { key: "cuentas-por-cobrar", label: "Cuentas por cobrar" },
  { key: "estados-financieros", label: "Estados Financieros" },
  { key: "analisis-financiero", label: "Análisis Financiero" },
  { key: "presupuestos", label: "Presupuestos" },
];

interface FinanzasHeaderProps {
  selectedKey?: string;
  onSelectionChange?: (key: any) => void;
}

export function FinanzasHeader({ selectedKey, onSelectionChange }: FinanzasHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Finanzas</h1>
      <Tabs
        aria-label="Finanzas sections"
        color="primary"
        variant="underlined"
        selectedKey={selectedKey ?? "ventas"}
        onSelectionChange={onSelectionChange}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
