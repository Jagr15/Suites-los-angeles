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
import { User } from "./types";

interface UserTableProps {
  items: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UserTable({ items, onEdit, onDelete }: UserTableProps) {
  const renderCell = (user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];

    switch (columnKey) {
      case "email":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{user.email}</p>
            <p className="text-bold text-tiny text-default-400 capitalize">
              {user.profileName}
            </p>
          </div>
        );
      case "role":
        return (
          <Chip
            className="capitalize"
            color={user.role === "Administrador" ? "warning" : "primary"}
            size="sm"
            variant="flat"
          >
            {user.role}
          </Chip>
        );
      case "isActive":
        return (
          <Chip
            className="capitalize"
            color={user.isActive ? "success" : "danger"}
            size="sm"
            variant="solid"
          >
            {user.isActive ? "Activo" : "Suspendido"}
          </Chip>
        );
      case "permissions":
        const activeCount = Object.values(user.permissions).filter(Boolean).length;
        return (
          <p className="text-bold text-small text-default-500">
            {activeCount} Módulos Activos
          </p>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Editar usuario">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(user)}
              >
                <PencilSquareIcon className="size-5 text-default-400" />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar usuario">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onDelete(user.id)}
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
    <Table aria-label="Tabla de usuarios" removeWrapper>
      <TableHeader>
        <TableColumn key="email">USUARIO / EMAIL</TableColumn>
        <TableColumn key="role">ROL</TableColumn>
        <TableColumn key="permissions">PERMISOS</TableColumn>
        <TableColumn key="isActive">ESTADO</TableColumn>
        <TableColumn key="actions">ACCIONES</TableColumn>
      </TableHeader>
      <TableBody items={items} emptyContent={"No se encontraron usuarios"}>
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
