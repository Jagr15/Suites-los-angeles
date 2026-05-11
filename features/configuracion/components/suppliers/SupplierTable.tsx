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
} from "@heroui/react";
import {
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Supplier } from "./types";

interface SupplierTableProps {
  items: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SupplierTable({ 
  items, 
  onEdit, 
  onDelete, 
  isLoading 
}: SupplierTableProps) {
  
  const renderCell = (supplier: Supplier, columnKey: React.Key) => {
    switch (columnKey) {
      case "businessName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small font-medium">{supplier.businessName}</p>
            <p className="text-bold text-tiny text-default-400">RFC: {supplier.rfc}</p>
          </div>
        );
      case "contact":
        const firstContact = supplier.contacts?.[0];
        const contactCount = supplier.contacts?.length || 0;
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {firstContact ? firstContact.name : "Sin contacto"}
              {contactCount > 1 && (
                <span className="ml-1 text-tiny text-primary font-bold">
                   (+{contactCount - 1})
                </span>
              )}
            </p>
            <p className="text-bold text-tiny text-default-500">
              {firstContact ? firstContact.phone : "Pendiente"}
            </p>
          </div>
        );
      case "credit":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{supplier.creditDays} Días</p>
            <p className="text-bold text-tiny text-default-400">Condiciones</p>
          </div>
        );
      case "bank":
        const firstAccount = supplier.bankAccounts?.[0];
        const accountCount = supplier.bankAccounts?.length || 0;
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {firstAccount ? firstAccount.bankName : "Sin cuenta"}
              {accountCount > 1 && (
                <span className="ml-1 text-tiny text-primary font-bold">
                  (+{accountCount - 1})
                </span>
              )}
            </p>
            <p className="text-bold text-tiny text-default-400">
              {firstAccount ? `Cuenta: ${firstAccount.accountNumber}` : "Pendiente de registro"}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Editar proveedor">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(supplier)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            {/* Borrar button moved to edit modal per request */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Table 
      aria-label="Tabla de proveedores" 
      removeWrapper
      classNames={{
        th: "bg-default-50 text-default-600 font-semibold",
        td: "py-3 border-b border-divider",
      }}
    >
      <TableHeader>
        <TableColumn key="businessName">PROVEEDOR / RFC</TableColumn>
        <TableColumn key="contact">CONTACTO PRINCIPAL</TableColumn>
        <TableColumn key="credit">CRÉDITO</TableColumn>
        <TableColumn key="bank">DATOS BANCARIOS</TableColumn>
        <TableColumn key="actions">ACCIONES</TableColumn>
      </TableHeader>
      <TableBody 
        items={items}
        emptyContent={isLoading ? " " : "No se encontraron proveedores"}
        loadingContent={<p>Cargando proveedores...</p>}
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
