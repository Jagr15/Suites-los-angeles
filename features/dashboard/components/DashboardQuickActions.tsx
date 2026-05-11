"use client";

import Link from "next/link";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";

export function DashboardQuickActions() {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-lg font-semibold">Acciones rápidas</h2>
      </CardHeader>
      <CardBody className="gap-2">
        <Button
          as={Link}
          href="/dashboard/ventas"
          color="primary"
          variant="flat"
          fullWidth
          className="justify-start"
        >
          Nueva venta
        </Button>
        <Button
          as={Link}
          href="/dashboard/productos"
          color="secondary"
          variant="flat"
          fullWidth
          className="justify-start"
        >
          Gestionar productos
        </Button>
        <Button
          as={Link}
          href="/dashboard/reportes"
          color="success"
          variant="flat"
          fullWidth
          className="justify-start"
        >
          Ver reportes
        </Button>
      </CardBody>
    </Card>
  );
}
