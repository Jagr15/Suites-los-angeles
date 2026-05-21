"use client";

import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import { usePathname } from "next/navigation";

type DashboardBreadcrumbProps = {
  module?: string;
  submodule?: string;
};

const MODULE_BY_PATH: Array<{ prefix: string; module: string; submodule: string }> = [
  { prefix: "/dashboard/productos", module: "Productos", submodule: "Catálogo" },
  { prefix: "/dashboard/proveedores", module: "Proveedores", submodule: "Compras" },
  { prefix: "/dashboard/bodega", module: "Bodega", submodule: "Entradas" },
  { prefix: "/dashboard/rutas", module: "Rutas", submodule: "Mapa" },
  { prefix: "/dashboard/finanzas", module: "Finanzas", submodule: "Ventas" },
  { prefix: "/dashboard/clientes", module: "Clientes", submodule: "Registro" },
  { prefix: "/dashboard/configuracion", module: "Administración", submodule: "Usuarios" },
  { prefix: "/dashboard/cuenta", module: "Mi Cuenta", submodule: "Perfil" },
  { prefix: "/dashboard", module: "Inicio", submodule: "Resumen" },
];

export function DashboardBreadcrumb({ module, submodule }: DashboardBreadcrumbProps) {
  const pathname = usePathname();
  const detected = MODULE_BY_PATH.find((entry) => pathname.startsWith(entry.prefix)) || MODULE_BY_PATH[MODULE_BY_PATH.length - 1];
  const main = module || detected.module;
  const child = submodule || detected.submodule;

  return (
    <Breadcrumbs size="sm" classNames={{ base: "text-default-500" }}>
      <BreadcrumbItem>{main}</BreadcrumbItem>
      <BreadcrumbItem>{child}</BreadcrumbItem>
    </Breadcrumbs>
  );
}
