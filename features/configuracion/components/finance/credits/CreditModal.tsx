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
  addToast,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

interface CreditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  credit?: Doc<"credits">;
}

type CreditFormData = {
  institution: string;
  totalAmount: number;
  downPayment: number;
  remainingCapital: number;
  interestRate: number;
  termMonths: number;
  closingDay: number;
  startDate: string;
  type: "Hipotecario" | "Automotriz" | "Personal" | "Arrendamiento";
};

export function CreditModal({ isOpen, onOpenChange, credit }: CreditModalProps) {
  const createCredit = useMutation(api.credits.functions.create);
  const updateCredit = useMutation(api.credits.functions.update);

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreditFormData>({
    defaultValues: {
      type: "Personal",
      interestRate: 0,
      termMonths: 12,
      closingDay: 1,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (credit) {
      reset({
        institution: credit.institution,
        totalAmount: credit.totalAmount,
        downPayment: credit.downPayment,
        remainingCapital: credit.remainingCapital,
        interestRate: credit.interestRate,
        termMonths: credit.termMonths,
        closingDay: credit.closingDay,
        startDate: credit.startDate,
        type: credit.type,
      });
    } else {
      reset({
        type: "Personal",
        interestRate: 0,
        termMonths: 12,
        closingDay: 1,
        startDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [credit, reset]);

  const onSubmit = async (data: CreditFormData) => {
    try {
      const payload = {
        ...data,
        totalAmount: Number(data.totalAmount),
        downPayment: Number(data.downPayment),
        remainingCapital: Number(data.remainingCapital),
        interestRate: Number(data.interestRate),
        termMonths: Number(data.termMonths),
        closingDay: Number(data.closingDay),
      };

      if (credit) {
        await updateCredit({
          id: credit._id,
          ...payload,
        });
        addToast({
          title: "Crédito actualizado",
          description: "Los cambios se han guardado correctamente.",
          color: "success",
        });
      } else {
        await createCredit(payload);
        addToast({
          title: "Crédito registrado",
          description: "El nuevo crédito se ha guardado correctamente.",
          color: "success",
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo guardar el crédito.",
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
              {credit ? "Editar Crédito" : "Añadir Crédito / Arrendamiento"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <Input
                  {...register("institution", { required: true })}
                  label="Institución / Agencia"
                  placeholder="Ej. Ford"
                  variant="bordered"
                  labelPlacement="outside"
                  className="md:col-span-2"
                />
                <Select
                  label="Tipo de Crédito"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[watch("type")]}
                  onSelectionChange={(keys) => setValue("type", Array.from(keys)[0] as any)}
                >
                  <SelectItem key="Hipotecario">Hipotecario</SelectItem>
                  <SelectItem key="Automotriz">Automotriz</SelectItem>
                  <SelectItem key="Personal">Personal</SelectItem>
                  <SelectItem key="Arrendamiento">Arrendamiento</SelectItem>
                </Select>
                <Input
                  {...register("startDate", { required: true })}
                  label="Fecha de Inicio"
                  type="date"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  {...register("totalAmount", { required: true })}
                  label="Monto Total"
                  type="number"
                  placeholder="0.00"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<span className="text-default-400">$</span>}
                />
                <Input
                  {...register("downPayment", { required: true })}
                  label="Enganche / Pago Inicial"
                  type="number"
                  placeholder="0.00"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<span className="text-default-400">$</span>}
                />
                <Input
                  {...register("remainingCapital", { required: true })}
                  label="Capital Pendiente"
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
                  placeholder="48"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  {...register("closingDay", { required: true })}
                  label="Día de Corte"
                  type="number"
                  placeholder="15"
                  variant="bordered"
                  labelPlacement="outside"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                {credit ? "Actualizar" : "Guardar Registro"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
