"use client";

import { Tabs, Tab } from "@heroui/react";

const tabs = [
  { key: "cargas", label: "Cargas" },
  { key: "mapa", label: "Mapa" },
  { key: "inventario", label: "Inventario" },
  { key: "ventas", label: "Ventas" },
  { key: "creditos", label: "Créditos" },
  { key: "gastos", label: "Gastos" },
];

interface RutasHeaderProps {
  selectedKey?: string;
  onSelectionChange?: (key: any) => void;
  showTitle?: boolean;
}

export function RutasHeader({ selectedKey, onSelectionChange, showTitle = true }: RutasHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {showTitle && <h1 className="text-xl font-semibold text-foreground">Rutas</h1>}
      <Tabs
        aria-label="Rutas sections"
        color="primary"
        variant="underlined"
        selectedKey={selectedKey}
        onSelectionChange={onSelectionChange}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
