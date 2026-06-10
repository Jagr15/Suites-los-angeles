"use client";

import {
  DashboardStats,
  DashboardTable,
  DashboardQuickActions,
  DashboardRecentEntries,
} from "../components";

export function DashboardPage() {
  return (
    <div className="flex flex-col">
      <div className="space-y-4 p-4 md:p-5">
        <DashboardStats />
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardTable />
          </div>
          <DashboardQuickActions />
        </div>
        <DashboardRecentEntries />
      </div>
    </div>
  );
}
