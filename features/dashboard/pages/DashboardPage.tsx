"use client";

import {
  DashboardHeader,
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
      <div className="space-y-8 p-6">
        <DashboardStats />
        <DashboardCharts />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardTable />
          </div>
          <div className="flex flex-col gap-6">
            <DashboardAgents />
            <DashboardLatestTransactions />
            <DashboardQuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
