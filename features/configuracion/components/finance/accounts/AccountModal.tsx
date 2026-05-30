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
  Switch,
  addToast,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface AccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Doc<"finance_accounts">;
}

type AccountFormData = {
  alias: string;
  type: "Débito" | "Crédito" | "Caja Chica" | "Caja Fuerte";
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  responsibleProfileId?: string;
  responsibleName?: string;
};

export function AccountModal({ isOpen, onOpenChange, account }: AccountModalProps) {
  const createAccount = useMutation(api.finance_accounts.functions.create);
  const updateAccount = useMutation(api.finance_accounts.functions.update);
  const profiles = useQuery(api.profiles.queries.listAll) || [];

  const { register, handleSubmit, reset, setValue, watch, control } = useForm<AccountFormData>({
    defaultValues: {
      type: "Débito",
      currency: "MXN",
      isActive: true,
      initialBalance: 0,
      currentBalance: 0,
    },
  });

  useEffect(() => {
    if (account) {
      reset({
        alias: account.alias,
        type: account.type,
        initialBalance: account.initialBalance,
        currentBalance: account.currentBalance,
        currency: account.currency,
        isActive: account.isActive,
        responsibleProfileId: (account as any).responsibleProfileId ? String((account as any).responsibleProfileId) : "",
        responsibleName: (account as any).responsibleName || "",
      });
    } else {
      reset({
        type: "Débito",
        currency: "MXN",
        isActive: true,
        initialBalance: 0,
        currentBalance: 0,
        responsibleProfileId: "",
        responsibleName: "",
      });
    }
  }, [account, reset]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      const payload = {
        ...data,
        initialBalance: Number(data.initialBalance),
        currentBalance: account ? Number(data.currentBalance) : Number(data.initialBalance),
        responsibleProfileId: data.responsibleProfileId
          ? (data.responsibleProfileId as Id<"profiles">)
          : undefined,
        linkedEntityType: (account as any)?.linkedEntityType || "manual",
        linkedEntityId: (account as any)?.linkedEntityId,
        isSystemLinked: (account as any)?.isSystemLinked || false,
      };

      if (account) {
        await updateAccount({
          id: account._id,
          ...payload,
        });
        addToast({
          title: "Cuenta actualizada",
          description: "Los cambios se han guardado correctamente.",
          color: "success",
        });
      } else {
        await createAccount(payload);
        addToast({
          title: "Cuenta configurada",
          description: "La nueva cuenta se ha guardado correctamente.",
          color: "success",
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo guardar la cuenta.",
        color: "danger",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {account ? "Editar Cuenta / Caja" : "Configuración de Cuenta o Caja"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <Input
                  {...register("alias", { required: true })}
                  label="Alias de la Cuenta"
                  placeholder="Ej. Nómina Santander"
                  variant="bordered"
                  labelPlacement="outside"
                  className="md:col-span-2"
                />
                <Select
                  label="Tipo de Cuenta"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={[watch("type")]}
                  onSelectionChange={(keys) => setValue("type", Array.from(keys)[0] as any)}
                >
                  <SelectItem key="Débito">Débito</SelectItem>
                  <SelectItem key="Crédito">Crédito</SelectItem>
                  <SelectItem key="Caja Chica">Caja Chica</SelectItem>
                  <SelectItem key="Caja Fuerte">Caja Fuerte</SelectItem>
                </Select>
                <Select
                  label="Responsable"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={watch("responsibleProfileId") ? [watch("responsibleProfileId") as string] : []}
                  onSelectionChange={(keys) => {
                    const nextId = String(Array.from(keys)[0] || "");
                    const profile = profiles.find((p: any) => String(p._id) === nextId);
                    setValue("responsibleProfileId", nextId);
                    setValue("responsibleName", profile?.fullName || "");
                  }}
                >
                  {profiles.map((profile: any) => (
                    <SelectItem key={String(profile._id)}>{profile.fullName}</SelectItem>
                  ))}
                </Select>
                <Input
                  {...register("currency", { required: true })}
                  label="Moneda"
                  placeholder="MXN"
                  variant="bordered"
                  labelPlacement="outside"
                />
                <Input
                  {...register("initialBalance", { required: true })}
                  label="Saldo Inicial"
                  type="number"
                  placeholder="0.00"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<span className="text-default-400">$</span>}
                  disabled={!!account}
                />
                {account && (
                  <Input
                    {...register("currentBalance", { required: true })}
                    label="Saldo Actual"
                    type="number"
                    placeholder="0.00"
                    variant="bordered"
                    labelPlacement="outside"
                    startContent={<span className="text-default-400">$</span>}
                  />
                )}
                <div className="flex items-center gap-2 mt-4 md:col-span-2">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        isSelected={field.value} 
                        onValueChange={field.onChange}
                        size="sm"
                      >
                        Cuenta Activa
                      </Switch>
                    )}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                {account ? "Actualizar" : "Guardar Registro"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
