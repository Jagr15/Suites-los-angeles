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
  Select,
  SelectItem,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  proveedorSchema,
  type ProveedorFormValues,
  PROVEEDOR_STATUS,
} from "@/shared/schemas";
import type { ProveedorRow } from "@/shared/mocks";

const defaultValues: ProveedorFormValues = {
  proveedor: "",
  fecha: "",
  status: "Pendiente",
  monto: "",
};

function proveedorToFormValues(p: ProveedorRow): ProveedorFormValues {
  return {
    proveedor: p.proveedor,
    fecha: p.fecha,
    status: p.status as ProveedorFormValues["status"],
    monto: p.monto,
  };
}

function toProveedorRow(data: ProveedorFormValues, id: string): ProveedorRow {
  return {
    id,
    proveedor: data.proveedor,
    fecha: data.fecha,
    status: data.status,
    monto: data.monto,
  };
}

type ProveedorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Si se pasa, el modal está en modo edición. */
  proveedor?: ProveedorRow | null;
  /** (datos del formulario, id si es edición) */
  onSubmit?: (data: ProveedorRow, editId?: string) => void;
  onDelete?: (item: ProveedorRow) => void;
};

export function ProveedorModal({
  isOpen,
  onClose,
  proveedor,
  onSubmit,
  onDelete,
}: ProveedorModalProps) {
  const isEdit = !!proveedor;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(proveedor ? proveedorToFormValues(proveedor) : defaultValues);
  }, [isOpen, proveedor, reset]);

  const onFormSubmit = (data: ProveedorFormValues) => {
    const row = toProveedorRow(data, proveedor?.id ?? "");
    onSubmit?.(row, proveedor?.id);
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
            {isEdit ? "Editar proveedor" : "Crear proveedor"}
          </ModalHeader>
          <ModalBody className="max-h-[70vh] shrink overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="proveedor"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Proveedor"
                    placeholder="Nombre del proveedor"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="sm:col-span-2"
                    isInvalid={!!errors.proveedor}
                    errorMessage={errors.proveedor?.message}
                  />
                )}
              />
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Fecha"
                    placeholder="Ej. 21 Junio 2023"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.fecha}
                    errorMessage={errors.fecha?.message}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Estado"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(s) =>
                      field.onChange(Array.from(s)[0] ?? "Pendiente")
                    }
                    onBlur={field.onBlur}
                  >
                    {PROVEEDOR_STATUS.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Monto"
                    placeholder="Ej. -12519.93 o 8450.00"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.monto}
                    errorMessage={errors.monto?.message}
                  />
                )}
              />
            </div>
          </ModalBody>
          <ModalFooter className="shrink-0 flex-wrap gap-2">
            <Button type="button" variant="light" onPress={handleClose}>
              Cancelar
            </Button>
            {isEdit && onDelete && (
              <Button
                type="button"
                color="danger"
                variant="flat"
                startContent={<TrashIcon className="size-5" />}
                onPress={() => {
                  if (proveedor) onDelete(proveedor);
                }}
              >
                Eliminar
              </Button>
            )}
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
              {isEdit ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
