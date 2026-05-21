"use client";

import React from "react";
import { DashboardHeader, DashboardBreadcrumb } from "@/features/dashboard/components";
import { AccountSettingsCard } from "../components/AccountSettingsCard";

export function AccountPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="flex flex-col gap-6 p-6">
        <DashboardBreadcrumb module="Mi Cuenta" submodule="Perfil" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Configuración de Cuenta
          </h1>
          <span className="text-sm text-default-500">
            Gestiona tus credenciales y preferencias de seguridad
          </span>
        </div>

        <div className="mt-4">
          <AccountSettingsCard />
        </div>
      </div>
    </div>
  );
}
