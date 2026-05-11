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
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Almacen } from "@/shared/schemas";

interface BodegaTableProps {
  items: Almacen[];
  onEdit: (bodega: Almacen) => void;
  onDelete: (bodega: Almacen) => void;
  isLoading?: boolean;
}

const columns = [
  { key: "name", label: "BODEGA / UBICACIÓN" },
  { key: "manager", label: "ENCARGADO / TELÉFONO" },
  { key: "isActive", label: "ESTADO" },
  { key: "actions", label: "ACCIONES", align: "end" as const },
];

export function BodegaTable({ items, onEdit, onDelete, isLoading }: BodegaTableProps) {
  const renderCell = (bodega: Almacen, columnKey: React.Key) => {
    const key = String(columnKey);
    switch (key) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BuildingStorefrontIcon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="font-bold text-small text-foreground">{bodega.name}</p>
              <p className="text-tiny text-default-400">{bodega.address || "Sin dirección"}</p>
            </div>
          </div>
        );
      case "manager":
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <UserIcon className="size-3 text-default-400" />
              <p className="font-bold text-small text-default-700">{bodega.manager || "N/A"}</p>
            </div>
            {bodega.phone && (
              <div className="flex items-center gap-1">
                <PhoneIcon className="size-3 text-default-400" />
                <p className="text-tiny text-default-500">{bodega.phone}</p>
              </div>
            )}
          </div>
        );
      case "isActive":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={bodega.isActive ? "success" : "danger"}
            className="font-bold"
          >
            {bodega.isActive ? "ACTIVO" : "INACTIVO"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center justify-end gap-2">
            <Tooltip content="Editar bodega">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(bodega)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar bodega">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete(bodega)}
              >
                <TrashIcon className="size-5 text-danger" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return (bodega as any)[key]?.toString() || "";
    }
  };

  return (
    <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
      <Table 
        aria-label="Tabla de bodegas" 
        removeWrapper
        classNames={{
          th: "bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6",
          td: "px-6 py-4 border-b border-default-50 last:border-0",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.key} 
              align={column.align}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody 
          items={items} 
          emptyContent={isLoading ? "Cargando..." : "No se encontraron bodegas"}
        >
          {(item) => (
            <TableRow key={item._id} className="hover:bg-default-50/50 transition-colors">
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
