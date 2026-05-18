"use client";

import { Tabs, Tab } from "@heroui/react";

const tabs = [
  { key: "entradas", label: "Entradas" },
  { key: "salidas", label: "Salidas" },
  { key: "inventario", label: "Inventario" },
  { key: "ingresos", label: "Ingresos" },
  { key: "egresos", label: "Egresos" },
  { key: "nominas", label: "Nóminas" },
  { key: "catalogo", label: "Catálogo" },
];

type BodegaHeaderProps = {
  selectedKey?: string;
  onSelectionChange?: (key: React.Key) => void;
  visibleTabs?: string[];
};

export function BodegaHeader({ selectedKey, onSelectionChange, visibleTabs }: BodegaHeaderProps) {
  const allowedTabs = visibleTabs?.length ? tabs.filter((tab) => visibleTabs.includes(tab.key)) : tabs;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Bodega</h1>
      <Tabs
        aria-label="Compras Inventario"
        color="primary"
        selectedKey={selectedKey ?? "entradas"}
        onSelectionChange={onSelectionChange}
        variant="underlined"
      >
        {allowedTabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
