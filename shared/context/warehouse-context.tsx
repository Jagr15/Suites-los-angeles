"use client";

import { createContext, useContext, useMemo, useState } from "react";

type WarehouseContextValue = {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (warehouseId: string | null) => void;
};

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ selectedWarehouseId, setSelectedWarehouseId }),
    [selectedWarehouseId]
  );

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) {
    throw new Error("useWarehouse debe usarse dentro de WarehouseProvider");
  }
  return ctx;
}
