"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Tooltip,
  useDisclosure,
  addToast,
} from "@heroui/react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { AccountModal } from "./AccountModal";
import { ConfirmModal } from "@/shared/components";

export function AccountsTab() {
  const accounts = useQuery(api.finance_accounts.functions.list);
  const removeAccount = useMutation(api.finance_accounts.functions.remove);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { 
    isOpen: isConfirmOpen, 
    onOpen: onConfirmOpen, 
    onOpenChange: onConfirmOpenChange 
  } = useDisclosure();

  const [selectedAccount, setSelectedAccount] = useState<Doc<"finance_accounts"> | undefined>();
  const [accountToDelete, setAccountToDelete] = useState<Doc<"finance_accounts"> | undefined>();

  const formatCurrency = (val: number, currency: string = "MXN") =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(val);

  const handleEdit = (account: Doc<"finance_accounts">) => {
    setSelectedAccount(account);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedAccount(undefined);
    onOpen();
  };

  const handleDeleteClick = (account: Doc<"finance_accounts">) => {
    setAccountToDelete(account);
    onConfirmOpen();
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      try {
        await removeAccount({ id: accountToDelete._id });
        addToast({
          title: "Cuenta eliminada",
          color: "success",
        });
      } catch (error) {
        addToast({
          title: "Error",
          description: "No se pudo eliminar la cuenta.",
          color: "danger",
        });
      }
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Cajas y Cuentas Bancarias</h4>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleCreate}
        >
          Nueva Caja/Cuenta
        </Button>
      </div>

      <Table aria-label="Tabla de cuentas" removeWrapper>
        <TableHeader>
          <TableColumn>ALIAS</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn>SALDO ACTUAL</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={accounts ?? []} emptyContent="No hay cuentas registradas">
          {(item) => (
            <TableRow key={item._id}>
              <TableCell className="font-semibold">{item.alias}</TableCell>
              <TableCell>
                <Chip size="sm" variant="bordered">
                  {item.type}
                </Chip>
              </TableCell>
              <TableCell>{formatCurrency(item.currentBalance, item.currency)}</TableCell>
              <TableCell>
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={item.isActive ? "success" : "danger"}
                >
                  {item.isActive ? "Activa" : "Inactiva"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Editar">
                    <PencilSquareIcon 
                      className="size-5 text-default-400 cursor-pointer hover:text-primary transition-colors" 
                      onClick={() => handleEdit(item)}
                    />
                  </Tooltip>
                  <Tooltip content="Eliminar" color="danger">
                    <TrashIcon 
                      className="size-5 text-default-400 cursor-pointer hover:text-danger transition-colors" 
                      onClick={() => handleDeleteClick(item)}
                    />
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AccountModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        account={selectedAccount} 
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => onConfirmOpenChange()}
        title="Eliminar Cuenta"
        description={`¿Estás seguro de eliminar la cuenta ${accountToDelete?.alias}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </div>
  );
}
