"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  rutaSchema,
  type RutaFormValues,
} from "@/shared/schemas";
import type { Route } from "@/features/configuracion/components/routes/types";

const TIPO_LABELS: Record<string, string> = {
  sucursal: "Entrega a sucursal",
  envio: "Envío",
};

const TIPO_ENTREGA_OPTIONS = ["sucursal", "envio"] as const;

const defaultValues: any = {
  name: "",
  destination: "",
  assignedProfileId: "",
  deliveryType: "sucursal",
  isActive: true,
};

function routeToFormValues(p: Route): any {
  return {
    name: p.name,
    destination: p.destination,
    assignedProfileId: p.assignedProfileId,
    deliveryType: p.deliveryType ?? "sucursal",
    isActive: p.isActive,
  };
}

type RutaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ruta?: Route | null;
  onSubmit?: (data: any, editId?: string) => void;
};

export function RutaModal({ isOpen, onClose, ruta, onSubmit }: RutaModalProps) {
  const isEdit = !!ruta;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues,
  });

  const deliveryType = useWatch({ control, name: "deliveryType", defaultValue: "sucursal" });

  useEffect(() => {
    if (!isOpen) return;
    reset(ruta ? routeToFormValues(ruta) : defaultValues);
  }, [isOpen, ruta, reset]);

  const onFormSubmit = (data: any) => {
    onSubmit?.(data, ruta?.id);
    reset(defaultValues);
    onClose();
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="lg" scrollBehavior="inside">
      <ModalContent className="overflow-hidden">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
          <ModalHeader className="shrink-0">
            {isEdit ? "Editar ruta" : "Crear ruta"}
          </ModalHeader>
          <ModalBody className="max-h-[70vh] shrink overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Ruta"
                    placeholder="Ej. Ruta 001"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message?.toString()}
                  />
                )}
              />
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Destino"
                    placeholder="Ej. Manzanillo"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.destination}
                    errorMessage={errors.destination?.message?.toString()}
                  />
                )}
              />
              <Controller
                name="assignedProfileId"
                control={control}
                render={({ field }) => (
                  <Input
                    label="ID de Responsable"
                    placeholder="ID del perfil"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="sm:col-span-2"
                  />
                )}
              />
              <Controller
                name="deliveryType"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Tipo de entrega"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(s) =>
                      field.onChange(Array.from(s)[0] ?? "sucursal")
                    }
                    onBlur={field.onBlur}
                    className="sm:col-span-2"
                  >
                    <SelectItem key="sucursal" textValue="Sucursal">Sucursal</SelectItem>
                    <SelectItem key="envio" textValue="Envío">Envío</SelectItem>
                  </Select>
                )}
              />
            </div>
          </ModalBody>
          <ModalFooter className="shrink-0 flex-wrap gap-2">
            <Button type="button" variant="light" onPress={handleClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              type="submit"
              startContent={
                isEdit ? (
                  <PencilSquareIcon className="size-5" />
                ) : (
                  <PlusIcon className="size-5" />
                )
              }
            >
              {isEdit ? "Guardar cambios" : "Crear ruta"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
