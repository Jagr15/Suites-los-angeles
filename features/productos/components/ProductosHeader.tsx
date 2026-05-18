"use client";

import { Tabs, Tab } from "@heroui/react";

const tabs = [
  { key: "costo", label: "Costo" },
  { key: "mayoreo", label: "Mayoreo" },
  { key: "venta", label: "Venta" },
];

type ProductosHeaderProps = {
  activeTab: string;
  onTabChange: (key: string) => void;
  visibleTabs?: string[];
};

export function ProductosHeader({ activeTab, onTabChange, visibleTabs }: ProductosHeaderProps) {
  const allowedTabs = visibleTabs?.length ? tabs.filter((tab) => visibleTabs.includes(tab.key)) : tabs;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Productos</h1>
      <Tabs aria-label="Tipo de lista" color="primary" selectedKey={activeTab} onSelectionChange={(k) => onTabChange(k.toString())} variant="underlined">
        {allowedTabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
