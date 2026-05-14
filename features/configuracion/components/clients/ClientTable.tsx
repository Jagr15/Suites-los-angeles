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
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Client } from "./types";
import { getGoogleMapsLink } from "./location-utils";

interface ClientTableProps {
  items: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientTable({ items, onEdit, onDelete }: ClientTableProps) {
  const renderCell = (client: Client, columnKey: React.Key) => {
    const cellValue = client[columnKey as keyof Client];

    switch (columnKey) {
      case "commercialName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{client.commercialName}</p>
            <p className="text-bold text-tiny text-default-400">Dir: {client.townName}</p>
          </div>
        );
      case "contact":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{client.buyerName}</p>
            <p className="text-bold text-tiny text-default-500">Encargado</p>
          </div>
        );
      case "visitFrequency":
        return (
          <p className="text-small font-medium">{client.visitFrequency}</p>
        );
      case "assignedRoute":
        return (
          <Chip size="sm" variant="flat" color="primary">
            {client.assignedRouteName}
          </Chip>
        );
      case "credit":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(client.creditLimit)}
            </p>
            <p className="text-bold text-tiny text-default-400">{client.creditDays} Días</p>
          </div>
        );
      case "requiresInvoice":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={client.requiresInvoice ? "primary" : "default"}
          >
            {client.requiresInvoice ? "Fiscal" : "Nota"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Ver ubicación">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const url = getGoogleMapsLink(client.lat, client.lng, client.mapsUrl);
                  if (url) window.open(url, "_blank");
                }}
              >
                <MapPinIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            <Tooltip content="Editar cliente">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(client)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar cliente">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete(client.id)}
              >
                <TrashIcon className="size-5 text-danger" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue?.toString() || "";
    }
  };

  return (
    <Table aria-label="Tabla de clientes" removeWrapper>
      <TableHeader>
        <TableColumn key="commercialName">CLIENTE / ZONA</TableColumn>
        <TableColumn key="contact">ENCARGADO</TableColumn>
        <TableColumn key="visitFrequency">FRECUENCIA</TableColumn>
        <TableColumn key="assignedRoute">RUTA</TableColumn>
        <TableColumn key="credit">CRÉDITO / DÍAS</TableColumn>
        <TableColumn key="requiresInvoice">FACTURA</TableColumn>
        <TableColumn key="actions">ACCIONES</TableColumn>
      </TableHeader>
      <TableBody items={items} emptyContent={"No se encontraron clientes"}>
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
