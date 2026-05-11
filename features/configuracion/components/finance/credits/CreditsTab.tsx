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
import { CreditModal } from "./CreditModal";
import { ConfirmModal } from "@/shared/components";

export function CreditsTab() {
  const credits = useQuery(api.credits.functions.list);
  const removeCredit = useMutation(api.credits.functions.remove);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { 
    isOpen: isConfirmOpen, 
    onOpen: onConfirmOpen, 
    onOpenChange: onConfirmOpenChange 
  } = useDisclosure();

  const [selectedCredit, setSelectedCredit] = useState<Doc<"credits"> | undefined>();
  const [creditToDelete, setCreditToDelete] = useState<Doc<"credits"> | undefined>();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(val);

  const handleEdit = (credit: Doc<"credits">) => {
    setSelectedCredit(credit);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedCredit(undefined);
    onOpen();
  };

  const handleDeleteClick = (credit: Doc<"credits">) => {
    setCreditToDelete(credit);
    onConfirmOpen();
  };

  const handleConfirmDelete = async () => {
    if (creditToDelete) {
      try {
        await removeCredit({ id: creditToDelete._id });
        addToast({
          title: "Crédito eliminado",
          color: "success",
        });
      } catch (error) {
        addToast({
          title: "Error",
          description: "No se pudo eliminar el crédito.",
          color: "danger",
        });
      }
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Créditos y Arrendamientos</h4>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleCreate}
        >
          Añadir Crédito
        </Button>
      </div>

      <Table aria-label="Tabla de créditos" removeWrapper>
        <TableHeader>
          <TableColumn>INSTITUCIÓN</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn>MONTO TOTAL</TableColumn>
          <TableColumn>CAPITAL PENDIENTE</TableColumn>
          <TableColumn>CORTE</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={credits ?? []} emptyContent="No hay créditos registrados">
          {(item) => (
            <TableRow key={item._id}>
              <TableCell className="font-medium">{item.institution}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
              <TableCell className="text-danger font-semibold">
                {formatCurrency(item.remainingCapital)}
              </TableCell>
              <TableCell>Día {item.closingDay}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Editar detalles">
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

      <CreditModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        credit={selectedCredit} 
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => onConfirmOpenChange()}
        title="Eliminar Crédito"
        description={`¿Estás seguro de eliminar el crédito de ${creditToDelete?.institution}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </div>
  );
}
