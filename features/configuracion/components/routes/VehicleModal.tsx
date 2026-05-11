"use client";

import React, { useState } from "react";
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
  Divider,
  addToast,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, VehicleSchema } from "./types";

interface VehicleModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (vehicleId: string) => void;
}

export function VehicleModal({ isOpen, onOpenChange, onSuccess }: VehicleModalProps) {
  const createAsset = useMutation(api.assets.mutations.create);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleSchema>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      plate: "",
      year: "",
      isActive: true,
      acquisitionValue: 0,
      acquisitionDate: new Date().toISOString().split("T")[0],
      usefulLifeYears: 5,
      status: "Activo",
    },
  });

  const onSubmit = async (data: VehicleSchema) => {
    setIsLoading(true);
    try {
      const id = await createAsset({
        name: data.name,
        category: "Equipo de Transporte",
        brand: data.brand || undefined,
        model: data.model || undefined,
        plate: data.plate,
        year: data.year || undefined,
        acquisitionValue: 0, // Default for logistics
        acquisitionDate: new Date().toISOString(), // Default for logistics
        usefulLifeYears: 5, // Default for logistics
        status: data.status,
      });
      
      addToast({
        title: "Transporte Registrado",
        description: "El nuevo activo de transporte ha sido añadido con éxito.",
        color: "success",
      });
      
      if (onSuccess) onSuccess(id);
      onOpenChange(false);
      reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar el transporte.";
      console.error("Error creating transport asset:", error);
      addToast({
        title: "Error",
        description: message,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Registrar Nuevo Transporte (Activo Fijo)</ModalHeader>
            <ModalBody>
              <form id="vehicle-form" onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Nombre / Alias"
                      placeholder="Ej. Camioneta Isuzu"
                      variant="bordered"
                      labelPlacement="outside"
                      isRequired
                    />
                  )}
                />
                {/* ... rest of the form remains same as it matches the fields we added to assets ... */}
                <Controller
                  name="plate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Placas"
                      placeholder="Ej. ABC-123-D"
                      variant="bordered"
                      labelPlacement="outside"
                      isRequired
                    />
                  )}
                />
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Marca"
                      placeholder="Ej. Isuzu"
                      variant="bordered"
                      labelPlacement="outside"
                    />
                  )}
                />
                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Modelo"
                      placeholder="Ej. Elf 300"
                      variant="bordered"
                      labelPlacement="outside"
                    />
                  )}
                />
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Año"
                      placeholder="Ej. 2023"
                      variant="bordered"
                      labelPlacement="outside"
                    />
                  )}
                />

                <div className="md:col-span-2 pt-2">
                  <Divider />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <span className="text-small font-medium">Estado del Activo</span>
                  <Controller
                    name="status"
                    control={control}
                    defaultValue="Activo"
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Selecciona estado"
                        variant="bordered"
                        selectedKeys={field.value ? [field.value] : ["Activo"]}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string;
                          field.onChange(val);
                        }}
                      >
                        <SelectItem key="Activo">Activo</SelectItem>
                        <SelectItem key="Inactivo">Inactivo</SelectItem>
                        <SelectItem key="Mantenimiento">Mantenimiento</SelectItem>
                      </Select>
                    )}
                  />
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit" form="vehicle-form" isLoading={isLoading}>
                Guardar Transporte
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
