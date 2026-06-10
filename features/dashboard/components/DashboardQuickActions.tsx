"use client";

import Link from "next/link";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  TruckIcon,
  UserPlusIcon,
  PlusCircleIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

const actions = [
  {
    label: "Nueva salida",
    description: "Abrir módulo de bodega",
    href: "/dashboard/bodega",
    icon: ArrowRightIcon,
    color: "primary" as const,
  },
  {
    label: "Nueva entrada",
    description: "Registrar compra o recepción",
    href: "/dashboard/bodega",
    icon: PlusCircleIcon,
    color: "success" as const,
  },
  {
    label: "Nuevo cliente",
    description: "Alta de cliente comercial",
    href: "/dashboard/clientes",
    icon: UserPlusIcon,
    color: "secondary" as const,
  },
  {
    label: "Nuevo producto",
    description: "Alta en catálogo",
    href: "/dashboard/productos",
    icon: CubeIcon,
    color: "warning" as const,
  },
  {
    label: "Ver rutas",
    description: "Consultar rutas activas",
    href: "/dashboard/rutas",
    icon: MapIcon,
    color: "default" as const,
  },
  {
    label: "Ver bodega",
    description: "Ir al módulo operativo",
    href: "/dashboard/bodega",
    icon: BuildingStorefrontIcon,
    color: "primary" as const,
  },
];

export function DashboardQuickActions() {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div>
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
          <p className="text-tiny text-default-500">Atajos operativos reales</p>
        </div>
      </CardHeader>
      <CardBody className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              as={Link}
              href={action.href}
              color={action.color}
              variant="flat"
              fullWidth
              className="h-auto justify-start py-3 text-left"
            >
              <div className="flex w-full items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/70">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{action.label}</p>
                  <p className="text-tiny opacity-70">{action.description}</p>
                </div>
                <TruckIcon className="size-4 shrink-0 opacity-40" />
              </div>
            </Button>
          );
        })}
      </CardBody>
    </Card>
  );
}
