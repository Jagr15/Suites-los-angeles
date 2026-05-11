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
  Divider,
  addToast,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetSchema, AssetSchema, assetCategories, Asset } from "./types";
import { useAssets } from "./use-assets";

interface AssetModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAsset: Asset | null;
  onClose: () => void;
}

export function AssetModal({
  isOpen,
  onOpenChange,
  selectedAsset,
  onClose,
}: AssetModalProps) {
  const { addAsset, updateAsset } = useAssets();
  const [isSaving, setIsSaving] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetSchema>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Mobiliario y Equipo de Oficina",
      acquisitionValue: 0,
      acquisitionDate: new Date().toISOString().split("T")[0],
      usefulLifeYears: 5,
      serialNumber: "",
      status: "Activo",
    },
  });

  useEffect(() => {
    if (selectedAsset) {
      reset({
        name: selectedAsset.name,
        description: selectedAsset.description || "",
        category: selectedAsset.category,
        acquisitionValue: selectedAsset.acquisitionValue,
        acquisitionDate: selectedAsset.acquisitionDate,
        usefulLifeYears: selectedAsset.usefulLifeYears,
        serialNumber: selectedAsset.serialNumber || "",
        status: selectedAsset.status,
      });
    } else {
      reset({
        name: "",
        description: "",
        category: "Mobiliario y Equipo de Oficina",
        acquisitionValue: 0,
        acquisitionDate: new Date().toISOString().split("T")[0],
        usefulLifeYears: 5,
        serialNumber: "",
        status: "Activo",
      });
    }
  }, [selectedAsset, reset, isOpen]);

  const onSubmit = async (data: AssetSchema) => {
    setIsSaving(true);
    try {
      if (selectedAsset) {
        await updateAsset(selectedAsset._id, data);
        addToast({
          title: "Activo Actualizado",
          description: "La información se guardó con éxito.",
          color: "success",
        });
      } else {
        await addAsset(data);
        addToast({
          title: "Activo Registrado",
          description: "El nuevo activo ha sido creado.",
          color: "success",
        });
      }
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Falla al procesar los datos del activo.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent>
        {(internalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {selectedAsset ? "Editar Activo Fijo" : "Registrar Activo Fijo"}
              <span className="text-tiny text-default-500 font-normal">
                {selectedAsset ? "Modifica los detalles del activo" : "Añade un nuevo recurso al catálogo contable"}
              </span>
            </ModalHeader>
            <ModalBody>
              <form id="asset-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Nombre del Activo"
                        placeholder="Ej. Servidor Dell PowerEdge"
                        variant="bordered"
                        labelPlacement="outside"
                        isRequired
                        isInvalid={!!errors.name}
                        errorMessage={errors.name?.message}
                        className="md:col-span-2"
                      />
                    )}
                  />

                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Categoría"
                        placeholder="Selecciona categoría"
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as any;
                          field.onChange(val);
                        }}
                        isRequired
                        isInvalid={!!errors.category}
                        errorMessage={errors.category?.message}
                      >
                        {assetCategories.map((cat) => (
                          <SelectItem key={cat} textValue={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Estado"
                        placeholder="Estado del activo"
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as any;
                          field.onChange(val);
                        }}
                        isRequired
                        isInvalid={!!errors.status}
                        errorMessage={errors.status?.message}
                      >
                        <SelectItem key="Activo">Activo</SelectItem>
                        <SelectItem key="Inactivo">Inactivo</SelectItem>
                        <SelectItem key="Mantenimiento">Mantenimiento</SelectItem>
                      </Select>
                    )}
                  />

                  <Controller
                    name="acquisitionValue"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Valor de Adquisición"
                        placeholder="0.00"
                        variant="bordered"
                        labelPlacement="outside"
                        type="number"
                        startContent={<span className="text-default-400">$</span>}
                        isRequired
                        isInvalid={!!errors.acquisitionValue}
                        errorMessage={errors.acquisitionValue?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value?.toString() ?? ""}
                      />
                    )}
                  />

                  <Controller
                    name="acquisitionDate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Fecha de Adquisición"
                        placeholder="YYYY-MM-DD"
                        variant="bordered"
                        labelPlacement="outside"
                        type="date"
                        isRequired
                        isInvalid={!!errors.acquisitionDate}
                        errorMessage={errors.acquisitionDate?.message}
                      />
                    )}
                  />

                  <Controller
                    name="usefulLifeYears"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Vida Útil (Años)"
                        placeholder="5"
                        variant="bordered"
                        labelPlacement="outside"
                        type="number"
                        isRequired
                        isInvalid={!!errors.usefulLifeYears}
                        errorMessage={errors.usefulLifeYears?.message}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value?.toString() ?? ""}
                      />
                    )}
                  />

                  <Controller
                    name="serialNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Número de Serie / Folio"
                        placeholder="Ej. SN-123456"
                        variant="bordered"
                        labelPlacement="outside"
                      />
                    )}
                  />

                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Notas / Descripción"
                        placeholder="Detalles adicionales..."
                        variant="bordered"
                        labelPlacement="outside"
                        className="md:col-span-2"
                      />
                    )}
                  />
                </div>
              </form>
            </ModalBody>
            <ModalFooter className="border-t border-divider py-4">
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                form="asset-form"
                type="submit"
                isLoading={isSaving} 
                className="font-semibold px-8 shadow-md"
              >
                {selectedAsset ? "Actualizar" : "Registrar Activo"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
