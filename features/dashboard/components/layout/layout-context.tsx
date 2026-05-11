"use client";

import React, { createContext, useContext, useState } from "react";

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const setCollapsed = () => setCollapsedState((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return ctx;
}
