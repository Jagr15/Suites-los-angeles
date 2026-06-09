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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CLIENT_TYPE_LABELS, Client } from "./types";
import { getAddressReferenceFromMapsUrl } from "./location-utils";

type PricingLevelItem = {
  _id: string;
  code: string;
  name: string;
};

interface ClientTableProps {
  items: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientTable({ items, onEdit, onDelete }: ClientTableProps) {
  const pricingLevels = (useQuery(api.pricing.queries.listCustomerLevels) || []) as PricingLevelItem[];
  const levelById = new Map(pricingLevels.map((level) => [String(level._id), level]));

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
      case "clientType":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={client.clientType === "wholesaler" ? "secondary" : client.clientType === "retail" ? "warning" : "primary"}
          >
            {CLIENT_TYPE_LABELS[client.clientType || "commercial"]}
          </Chip>
        );
      case "visitFrequency":
        return (
          <p className="text-small font-medium">{client.visitFrequency}</p>
        );
      case "pricingCustomerLevelId": {
        const level = client.pricingCustomerLevelId ? levelById.get(String(client.pricingCustomerLevelId)) : null;
        return (
          <div className="flex flex-col gap-1">
            <Chip size="sm" variant="flat" color={level ? "secondary" : "default"}>
              {level ? `${level.code} · ${level.name}` : "Sin nivel"}
            </Chip>
          </div>
        );
      }
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
      case "location": {
        const address = getAddressReferenceFromMapsUrl(client.mapsUrl);
        const locality = client.townName || "Sin localidad";
        const zone = client.townName || "Sin zona";
        const municipalityAndState = [client.municipalityName, client.stateName].filter(Boolean).join(" / ");

        return (
          <div className="space-y-0.5">
            <p className="text-tiny text-default-700">{address || "Dirección / referencia no registrada"}</p>
            <p className="text-tiny text-default-500">Localidad: {locality}</p>
            <p className="text-tiny text-default-500">Zona: {zone}</p>
            <p className="text-tiny text-default-500">{municipalityAndState || "Municipio / Estado no registrado"}</p>
          </div>
        );
      }
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
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
        <TableColumn key="clientType">TIPO</TableColumn>
        <TableColumn key="contact">ENCARGADO</TableColumn>
        <TableColumn key="visitFrequency">FRECUENCIA</TableColumn>
        <TableColumn key="pricingCustomerLevelId">NIVEL</TableColumn>
        <TableColumn key="assignedRoute">RUTA</TableColumn>
        <TableColumn key="credit">CRÉDITO / DÍAS</TableColumn>
        <TableColumn key="requiresInvoice">FACTURA</TableColumn>
        <TableColumn key="location">UBICACIÓN</TableColumn>
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
