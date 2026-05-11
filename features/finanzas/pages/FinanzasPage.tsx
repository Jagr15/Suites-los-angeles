"use client";

import { useState } from "react";
import { DashboardHeader } from "@/features/dashboard/components";
import { FinanzasHeader, FinanzasCuentasPorPagar, FinanzasVentas, FinanzasCuentasPorCobrar, FinanzasEstadosFinancieros, FinanzasAnalisisFinanciero, FinanzasPresupuestos } from "../components";

export function FinanzasPage() {
  const [activeTab, setActiveTab] = useState<string>("ventas");

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="space-y-6 p-6">
        <FinanzasHeader
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
        />

        {activeTab === "ventas" && <FinanzasVentas />}
        {activeTab === "cuentas-por-pagar" && <FinanzasCuentasPorPagar />}
        {activeTab === "cuentas-por-cobrar" && <FinanzasCuentasPorCobrar />}
        {activeTab === "estados-financieros" && <FinanzasEstadosFinancieros />}
        {activeTab === "analisis-financiero" && <FinanzasAnalisisFinanciero />}
        {activeTab === "presupuestos" && <FinanzasPresupuestos />}

        {activeTab !== "ventas" && activeTab !== "cuentas-por-pagar" && activeTab !== "cuentas-por-cobrar" && activeTab !== "estados-financieros" && activeTab !== "analisis-financiero" && activeTab !== "presupuestos" && (
          <div className="flex flex-col items-center justify-center p-20 gap-4 bg-content1 rounded-3xl animate-in fade-in duration-500 border border-default-100">
            <h2 className="text-xl font-bold text-default-400 italic tracking-[2px] uppercase">
              Sección de {activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h2>
            <p className="text-default-400 text-sm">Próximamente disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
