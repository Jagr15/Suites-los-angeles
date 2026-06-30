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
      <div className="space-y-4 p-4 md:p-5 lg:p-6">
        <DashboardErrorBoundary title="Resumen operativo">
          <DashboardStats />
        </DashboardErrorBoundary>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="min-w-0">
            <DashboardErrorBoundary title="Últimas salidas">
              <DashboardTable />
            </DashboardErrorBoundary>
          </div>
          <div className="min-w-0">
            <DashboardErrorBoundary title="Acciones rápidas">
              <DashboardQuickActions />
            </DashboardErrorBoundary>
          </div>
        </div>
        <DashboardErrorBoundary title="Movimientos recientes">
          <DashboardRecentEntries />
        </DashboardErrorBoundary>
      </div>
    </div>
  );
}
