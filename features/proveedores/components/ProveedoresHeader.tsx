"use client";

import { Tabs, Tab } from "@heroui/react";

const tabs = [
  { key: "compras", label: "Compras" },
  { key: "presupuesto-compras", label: "Presupuesto de Compras" },
  { key: "estados-de-cuenta", label: "Estados de cuenta" },
];

type ProveedoresHeaderProps = {
  selectedKey?: string;
  onSelectionChange?: (key: React.Key) => void;
};

export function ProveedoresHeader({ selectedKey, onSelectionChange }: ProveedoresHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Proveedores</h1>
      <Tabs
        aria-label="Compras y estados de cuenta"
        color="primary"
        selectedKey={selectedKey ?? "compras"}
        onSelectionChange={onSelectionChange}
        variant="underlined"
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
