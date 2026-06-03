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
    <div className="w-full overflow-x-auto pb-1">
      <Tabs
        aria-label="Tipo de lista"
        color="primary"
        selectedKey={activeTab}
        onSelectionChange={(k) => onTabChange(k.toString())}
        variant="underlined"
        classNames={{
          base: "w-full",
          tabList: "w-max min-w-full gap-4",
        }}
      >
        {allowedTabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
    </div>
  );
}
