"use client";

import React, { useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface LoanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Doc<"loans">;
}

type LoanFormData = {
  type: "Otorgado" | "Recibido";
  subject: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  frequency: "Semanal" | "Quincenal" | "Mensual";
  startDate: string;
  status: "Activo" | "Liquidado" | "Vencido";
  notes?: string;
};

export function LoanModal({ isOpen, onOpenChange, loan }: LoanModalProps) {
  const createLoan = useMutation(api.loans.functions.create);
  const updateLoan = useMutation(api.loans.functions.update);

  const { register, handleSubmit, reset, setValue, watch } = useForm<LoanFormData>({
    defaultValues: {
      type: "Otorgado",
      frequency: "Mensual",
      status: "Activo",
      interestRate: 0,
      termMonths: 12,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (loan) {
      reset({
        type: loan.type,
        subject: loan.subject,
        amount: loan.amount,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        frequency: loan.frequency,
        startDate: loan.startDate,
        status: loan.status,
        notes: loan.notes,
      });
    } else {
      reset({
        type: "Otorgado",
        frequency: "Mensual",
        status: "Activo",
        interestRate: 0,
        termMonths: 12,
        startDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [loan, reset]);

  const onSubmit = async (data: LoanFormData) => {
    try {
      const payload = {
        ...data,
        subject: (data.subject || "").trim(),
        amount: Number(data.amount),
        interestRate: Number(data.interestRate),
        termMonths: Number(data.termMonths),
        startDate: data.startDate || new Date().toISOString().split("T")[0],
      };

      if (!payload.subject) {
        throw new Error("Captura el deudor/acreedor.");
      }
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        throw new Error("El monto debe ser mayor a 0.");
      }
      if (!Number.isFinite(payload.interestRate) || payload.interestRate < 0) {
        throw new Error("La tasa de interés no es válida.");
      }
      if (!Number.isFinite(payload.termMonths) || payload.termMonths <= 0) {
        throw new Error("El plazo en meses debe ser mayor a 0.");
      }

      if (loan) {
        await updateLoan({
          id: loan._id,
          ...payload,
        });
        addToast({
          title: "Préstamo actualizado",
          description: "Los cambios se han guardado correctamente.",
          color: "success",
        });
      } else {
        await createLoan(payload);
        addToast({
          title: "Préstamo registrado",
          description: "El nuevo préstamo se ha guardado correctamente.",
          color: "success",
        });
      }
      onOpenChange(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : "No se pudo guardar el préstamo.";
      addToast({
        title: "Error",
        description,
        color: "danger",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {loan ? "Editar Préstamo" : "Nuevo Registro de Préstamo"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <Select
                  label="Tipo"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[watch("type")]}
                  onSelectionChange={(keys) => setValue("type", Array.from(keys)[0] as any)}
                >
                  <SelectItem key="Otorgado">Otorgado (Salida)</SelectItem>
                  <SelectItem key="Recibido">Recibido (Entrada)</SelectItem>
                </Select>
                <Input
                  {...register("subject", { required: true })}
                  label="Sujeto (Deudor/Acreedor)"
                  placeholder="Ej. Banco / Empleado"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  {...register("amount", { required: true })}
                  label="Monto"
                  type="number"
                  placeholder="0.00"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<span className="text-default-400">$</span>}
                />
                <Input
                  {...register("interestRate", { required: true })}
                  label="Tasa de Interés (%)"
                  type="number"
                  placeholder="0"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  {...register("termMonths", { required: true })}
                  label="Plazo (Meses)"
                  type="number"
                  placeholder="12"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Select
                  label="Frecuencia"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[watch("frequency")]}
                  onSelectionChange={(keys) => setValue("frequency", Array.from(keys)[0] as any)}
                >
                  <SelectItem key="Semanal">Semanal</SelectItem>
                  <SelectItem key="Quincenal">Quincenal</SelectItem>
                  <SelectItem key="Mensual">Mensual</SelectItem>
                </Select>
                <Input
                  {...register("startDate", { required: true })}
                  label="Fecha de Inicio"
                  type="date"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Select
                  label="Estado"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[watch("status")]}
                  onSelectionChange={(keys) => setValue("status", Array.from(keys)[0] as any)}
                >
                  <SelectItem key="Activo">Activo</SelectItem>
                  <SelectItem key="Liquidado">Liquidado</SelectItem>
                  <SelectItem key="Vencido">Vencido</SelectItem>
                </Select>
                <Textarea
                  {...register("notes")}
                  label="Notas"
                  placeholder="Observaciones adicionales..."
                  variant="bordered"
                  labelPlacement="outside"
                  className="md:col-span-2"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                {loan ? "Actualizar" : "Guardar Registro"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
