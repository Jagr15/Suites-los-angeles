import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Button,
} from "@heroui/react";
import {
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Profile } from "./types";

interface ProfileTableProps {
  items: Profile[];
  label: string;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ProfileTable({ items, label, onEdit, onDelete, isLoading }: ProfileTableProps) {
  const renderCell = (profile: Profile, columnKey: React.Key) => {
    const cellValue = profile[columnKey as keyof Profile];

    switch (columnKey) {
      case "fullName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{String(cellValue || "")}</p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {profile.position}
            </p>
          </div>
        );
      case "hireDate":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{String(cellValue || "")}</p>
            <p className="text-bold text-tiny text-default-400">Ingreso</p>
          </div>
        );
      case "baseSalary":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(cellValue as number)}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={profile.status === "Activo" ? "success" : "danger"}
            size="sm"
            variant="flat"
          >
            {String(cellValue || "")}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Editar perfil">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(profile)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            {profile.status === "Activo" && (
              <Tooltip color="danger" content="Dar de baja">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => onDelete(profile.id)}
                >
                  <TrashIcon className="size-5 text-danger" />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return typeof cellValue === "string" || typeof cellValue === "number"
          ? cellValue
          : "";
    }
  };

  return (
    <Table aria-label={label} removeWrapper>
      <TableHeader>
        <TableColumn key="fullName">EMPLEADO</TableColumn>
        <TableColumn key="rfc">RFC</TableColumn>
        <TableColumn key="position">PUESTO</TableColumn>
        <TableColumn key="hireDate">FECHA INGRESO</TableColumn>
        <TableColumn key="baseSalary">SUELDO</TableColumn>
        <TableColumn key="status">ESTADO</TableColumn>
        <TableColumn key="actions">ACCIONES</TableColumn>
      </TableHeader>
      <TableBody 
        items={items} 
        emptyContent={isLoading ? " " : "No se encontraron perfiles"}
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
