"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
} from "@heroui/react";
import { almacenSchema, type AlmacenFormValues, type Almacen } from "@/shared/schemas";

interface BodegaModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodega: Almacen | null;
  onSubmit: (values: AlmacenFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function BodegaModal({
  isOpen,
  onClose,
  bodega,
  onSubmit,
  isLoading,
}: BodegaModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlmacenFormValues>({
    resolver: zodResolver(almacenSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (bodega) {
        reset({
          name: bodega.name,
          description: bodega.description || "",
          address: bodega.address || "",
          manager: bodega.manager || "",
          phone: bodega.phone || "",
          isActive: bodega.isActive,
        });
      } else {
        reset({
          name: "",
          description: "",
          address: "",
          manager: "",
          phone: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, bodega, reset]);

  const onFormSubmit = async (values: AlmacenFormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <ModalHeader className="flex flex-col gap-1">
            {bodega ? "Editar Bodega" : "Nueva Bodega"}
          </ModalHeader>
          <ModalBody className="gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  label="Nombre de la Bodega"
                  placeholder="Ej. Almacén Central"
                  labelPlacement="outside"
                  value={field.value}
                  onValueChange={field.onChange}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="manager"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Encargado"
                    placeholder="Nombre del responsable"
                    labelPlacement="outside"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Teléfono"
                    placeholder="Ej. 4441234567"
                    labelPlacement="outside"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input
                  label="Dirección"
                  placeholder="Calle, Número, Colonia"
                  labelPlacement="outside"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label="Descripción"
                  placeholder="Opcional..."
                  labelPlacement="outside"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-small text-default-600 font-medium">Estado Activo</span>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    isSelected={field.value}
                    onValueChange={field.onChange}
                    color="success"
                    size="sm"
                  />
                )}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={isLoading}>
              Cancelar
            </Button>
            <Button color="primary" type="submit" isLoading={isLoading}>
              {bodega ? "Guardar Cambios" : "Crear Bodega"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
