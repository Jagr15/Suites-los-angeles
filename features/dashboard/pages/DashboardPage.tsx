"use client";

import {
  DashboardStats,
  DashboardTable,
  DashboardQuickActions,
  DashboardRecentEntries,
} from "../components";
import { DashboardErrorBoundary } from "../components/DashboardErrorBoundary";

export function DashboardPage() {
  return (
    <div className="flex flex-col">
      <div className="space-y-4 p-4 md:p-5">
        <DashboardErrorBoundary title="Resumen operativo">
          <DashboardStats />
        </DashboardErrorBoundary>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardErrorBoundary title="Últimas salidas">
              <DashboardTable />
            </DashboardErrorBoundary>
          </div>
          <DashboardErrorBoundary title="Acciones rápidas">
            <DashboardQuickActions />
          </DashboardErrorBoundary>
        </div>
        <DashboardErrorBoundary title="Movimientos recientes">
          <DashboardRecentEntries />
        </DashboardErrorBoundary>
      </div>
    </div>
  );
}
