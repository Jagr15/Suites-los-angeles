"use client";

import {
  DashboardHeader,
  DashboardBreadcrumb,
  DashboardStats,
  DashboardCharts,
  DashboardTable,
  DashboardAgents,
  DashboardLatestTransactions,
  DashboardQuickActions,
} from "../components";

export function DashboardPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader />
      <div className="space-y-4 p-4 md:p-5">
        <DashboardBreadcrumb module="Inicio" submodule="Resumen" />
        <DashboardStats />
        <DashboardCharts />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardTable />
          </div>
          <div className="flex flex-col gap-4">
            <DashboardAgents />
            <DashboardLatestTransactions />
            <DashboardQuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
