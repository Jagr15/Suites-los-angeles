"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  useDisclosure,
} from "@heroui/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { RouteTable } from "./RouteTable";
import { RouteModal } from "./RouteModal";
import { ConfirmModal } from "@/shared/components";
import { useRoutes } from "./use-routes";
import { Route } from "./types";
import { addToast } from "@heroui/react";

export function RoutesManagementCard() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { routes, isLoading, deleteRoute } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedRoute(null);
    onOpen();
  };

  const handleDeleteRequest = (id: string) => {
    const route = routes.find((r) => r.id === id);
    if (route) setRouteToDelete(route);
  };

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;
    try {
      await deleteRoute(routeToDelete.id);
      addToast({
        title: "Ruta Eliminada",
        description: "El trayecto ha sido removido del sistema.",
        color: "success",
      });
      setRouteToDelete(null);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo realizar la eliminación.",
        color: "danger",
      });
    }
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground tracking-tight">
            Gestión de Rutas
          </h3>
          <p className="text-small text-default-500">
            Planificación de recorridos y asignación de flota
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleAdd}
        >
          Nueva Ruta
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-8 overflow-x-auto">
        <RouteTable 
          items={routes}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={isLoading}
        />

        <RouteModal 
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          selectedRoute={selectedRoute}
          onClose={onClose}
        />

        <ConfirmModal
          isOpen={!!routeToDelete}
          onClose={() => setRouteToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar ruta?"
          description={`Esta acción eliminará permanentemente la ruta "${routeToDelete?.name}".`}
          confirmLabel="Eliminar"
          variant="danger"
          requirePassword={true}
          adminPassword="admin123456"
        />
      </CardBody>
    </Card>
  );
}
