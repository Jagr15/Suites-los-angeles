"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Chip,
} from "@heroui/react";
import {
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Route } from "./types";

interface RouteTableProps {
  items: Route[];
  onEdit: (route: Route) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function RouteTable({ 
  items, 
  onEdit, 
  onDelete, 
  isLoading 
}: RouteTableProps) {
  
  const renderCell = (route: Route, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small font-medium">{route.name}</p>
            <p className="text-bold text-tiny text-default-400">{route.vehicleInfo}</p>
          </div>
        );
      case "assignedProfile":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small font-medium">{route.assignedProfileName}</p>
            <p className="text-bold text-tiny text-default-500">Responsable</p>
          </div>
        );
      case "operationDays":
        return (
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {route.operationDays.map((day) => (
              <Chip key={day} size="sm" variant="flat" className="min-w-6 text-center font-bold">
                {day}
              </Chip>
            ))}
          </div>
        );
      case "loadDay":
        return (
          <Chip color="secondary" size="sm" variant="dot" className="font-semibold">
            Carga: {route.loadDay}
          </Chip>
        );
      case "isActive":
        return (
          <Chip
            color={route.isActive ? "success" : "default"}
            size="sm"
            variant="flat"
            className="font-medium"
          >
            {route.isActive ? "Activa" : "Inactiva"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Editar ruta">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(route)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar ruta">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete(route.id)}
              >
                <TrashIcon className="size-5 text-danger" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Table 
      aria-label="Tabla de rutas" 
      removeWrapper
      classNames={{
        th: "bg-default-50 text-default-600 font-semibold",
        td: "py-3 border-b border-divider",
      }}
    >
      <TableHeader>
        <TableColumn key="name">RUTA / VEHÍCULO</TableColumn>
        <TableColumn key="assignedProfile">RESPONSABLE</TableColumn>
        <TableColumn key="operationDays">DÍAS OPERACIÓN</TableColumn>
        <TableColumn key="loadDay">DÍA CARGA</TableColumn>
        <TableColumn key="isActive">ESTADO</TableColumn>
        <TableColumn key="actions">ACCIONES</TableColumn>
      </TableHeader>
      <TableBody 
        items={items}
        emptyContent={isLoading ? " " : "No se encontraron rutas"}
        isLoading={isLoading}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
