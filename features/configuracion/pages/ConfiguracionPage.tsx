"use client";

import React from "react";
import {
  Tabs,
  Tab,
} from "@heroui/react";
import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UsersIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { DashboardHeader } from "@/features/dashboard/components";
import {
  PermissionsMatrixCard,
  ProfilesManagementCard,
  UserManagementCard,
  SuppliersManagementCard,
  ClientsManagementCard,
  RoutesManagementCard,
  FinanceManagementCard,
  BodegasManagementCard,
} from "../components";

export function ConfiguracionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Configuración del Sistema
          </h1>
          <span className="text-sm text-default-500">
            Distribuidora Los Angelos
          </span>
        </div>

        <Tabs
          aria-label="Opciones de configuración"
          color="primary"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-10",
            tabContent: "group-data-[selected=true]:text-primary font-medium text-default-500",
          }}
        >
          <Tab
            key="perfiles"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <IdentificationIcon className="size-4" />
                <span>Perfiles</span>
              </div>
            }
          >
            <div className="mt-4">
              <ProfilesManagementCard />
            </div>
          </Tab>

          <Tab
            key="usuarios"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <ShieldCheckIcon className="size-4" />
                <span>Usuarios</span>
              </div>
            }
          >
            <div className="mt-4 flex flex-col gap-4 min-w-0 overflow-x-hidden">
              <UserManagementCard />
              <PermissionsMatrixCard />
            </div>
          </Tab>

          <Tab
            key="proveedores"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <BuildingOfficeIcon className="size-4" />
                <span>Proveedores</span>
              </div>
            }
          >
            <div className="mt-4">
              <SuppliersManagementCard />
            </div>
          </Tab>

          <Tab
            key="bodegas"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <BuildingStorefrontIcon className="size-4" />
                <span>Bodegas</span>
              </div>
            }
          >
            <div className="mt-4">
              <BodegasManagementCard />
            </div>
          </Tab>

          <Tab
            key="rutas"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <MapIcon className="size-4" />
                <span>Rutas</span>
              </div>
            }
          >
            <div className="mt-4">
              <RoutesManagementCard />
            </div>
          </Tab>

          <Tab
            key="clientes"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <UsersIcon className="size-4" />
                <span>Clientes</span>
              </div>
            }
          >
            <div className="mt-4">
              <ClientsManagementCard />
            </div>
          </Tab>


          <Tab
            key="finanzas"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <BanknotesIcon className="size-4" />
                <span>Finanzas</span>
              </div>
            }
          >
            <div className="mt-4">
              <FinanceManagementCard />
            </div>
          </Tab>

        </Tabs>
      </div>
    </div>
  );
}
