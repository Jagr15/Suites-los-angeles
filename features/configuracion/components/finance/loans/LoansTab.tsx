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
import { LoanModal } from "./LoanModal";
import { ConfirmModal } from "@/shared/components";

export function LoansTab() {
  const loans = useQuery(api.loans.functions.list);
  const removeLoan = useMutation(api.loans.functions.remove);
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { 
    isOpen: isConfirmOpen, 
    onOpen: onConfirmOpen, 
    onOpenChange: onConfirmOpenChange 
  } = useDisclosure();
  
  const [selectedLoan, setSelectedLoan] = useState<Doc<"loans"> | undefined>();
  const [loanToDelete, setLoanToDelete] = useState<Doc<"loans"> | undefined>();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(val);

  const handleEdit = (loan: Doc<"loans">) => {
    setSelectedLoan(loan);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedLoan(undefined);
    onOpen();
  };

  const handleDeleteClick = (loan: Doc<"loans">) => {
    setLoanToDelete(loan);
    onConfirmOpen();
  };

  const handleConfirmDelete = async () => {
    if (loanToDelete) {
      try {
        await removeLoan({ id: loanToDelete._id });
        addToast({
          title: "Préstamo eliminado",
          color: "success",
        });
      } catch (error) {
        addToast({
          title: "Error",
          description: "No se pudo eliminar el préstamo.",
          color: "danger",
        });
      }
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Catálogo de Préstamos</h4>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleCreate}
        >
          Nuevo Préstamo
        </Button>
      </div>

      <Table aria-label="Tabla de préstamos" removeWrapper>
        <TableHeader>
          <TableColumn>TIPO</TableColumn>
          <TableColumn>DEUDOR/ACREEDOR</TableColumn>
          <TableColumn>MONTO</TableColumn>
          <TableColumn>TASA/PLAZO</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={loans ?? []} emptyContent="No hay préstamos registrados">
          {(item) => (
            <TableRow key={item._id}>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={item.type === "Otorgado" ? "success" : "warning"}
                >
                  {item.type}
                </Chip>
              </TableCell>
              <TableCell className="font-medium">{item.subject}</TableCell>
              <TableCell>{formatCurrency(item.amount)}</TableCell>
              <TableCell>
                {item.interestRate}% / {item.termMonths} Meses
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="dot" color={item.status === "Activo" ? "primary" : "default"}>
                  {item.status}
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

      <LoanModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        loan={selectedLoan} 
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => onConfirmOpenChange()}
        title="Eliminar Préstamo"
        description={`¿Estás seguro de eliminar el préstamo de ${loanToDelete?.subject}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </div>
  );
}
