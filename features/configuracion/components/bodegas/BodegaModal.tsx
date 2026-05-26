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
  Checkbox,
} from "@heroui/react";
import { almacenSchema, type AlmacenFormValues, type Almacen } from "@/shared/schemas";

interface BodegaModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodega: Almacen | null;
  onSubmit: (values: AlmacenFormValues) => Promise<void>;
  isLoading?: boolean;
  bodegueroUsers?: Array<{ _id: string; name?: string; email?: string }>;
}

export function BodegaModal({
  isOpen,
  onClose,
  bodega,
  onSubmit,
  isLoading,
  bodegueroUsers = [],
}: BodegaModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlmacenFormValues>({
    resolver: zodResolver(almacenSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      address: "",
      isActive: true,
      allowedUserIds: [],
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
          allowedUserIds: (bodega as any).allowedUserIds || [],
        });
      } else {
        reset({
          name: "",
          description: "",
          address: "",
          manager: "",
          phone: "",
          isActive: true,
          allowedUserIds: [],
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
        <form onSubmit={handleSubmit(onFormSubmit as any)}>
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
            <div className="space-y-2">
              <p className="text-small font-medium text-default-700">Usuarios con acceso</p>
              <Controller
                name="allowedUserIds"
                control={control}
                render={({ field }) => (
                  <div className="max-h-40 overflow-auto rounded-lg border border-default-200 p-2 space-y-1">
                    {bodegueroUsers.length === 0 ? (
                      <p className="text-xs text-default-500">No hay usuarios bodegueros disponibles.</p>
                    ) : (
                      bodegueroUsers.map((user) => {
                        const selected = (field.value || []).includes(user._id);
                        return (
                          <Checkbox
                            key={user._id}
                            isSelected={selected}
                            onValueChange={(isSelected) => {
                              const current = field.value || [];
                              const next = isSelected
                                ? [...current, user._id]
                                : current.filter((id: string) => id !== user._id);
                              field.onChange(next);
                            }}
                          >
                            {(user.name || user.email || user._id).trim()}
                          </Checkbox>
                        );
                      })
                    )}
                  </div>
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
