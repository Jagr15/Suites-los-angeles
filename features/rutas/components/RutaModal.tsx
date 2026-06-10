"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { api } from "@/convex/_generated/api";
import type { Route } from "@/features/configuracion/components/routes/types";

type RouteModalFormValues = {
  name: string;
  destination: string;
  assignedProfileId: string;
  deliveryType: "sucursal" | "envio";
  isActive: boolean;
};

const DEFAULT_VALUES: RouteModalFormValues = {
  name: "",
  destination: "",
  assignedProfileId: "",
  deliveryType: "sucursal",
  isActive: true,
};

function routeToFormValues(route: Route): RouteModalFormValues {
  return {
    name: route.name || "",
    destination: route.destination || "",
    assignedProfileId: route.assignedProfileId || "",
    deliveryType: route.deliveryType ?? "sucursal",
    isActive: route.isActive,
  };
}

type RouteProfile = {
  _id: string;
  fullName: string;
  userId?: string;
  group?: string;
};

const EMPTY_ROUTE_PROFILES: RouteProfile[] = [];

type RutaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ruta?: Route | null;
  onSubmit?: (data: RouteModalFormValues, editId?: string) => void;
};

export function RutaModal({ isOpen, onClose, ruta, onSubmit }: RutaModalProps) {
  const isEdit = !!ruta;
  const rawProfiles = useQuery(api.profiles.queries.listForSelection);
  const profiles = (rawProfiles ?? EMPTY_ROUTE_PROFILES) as RouteProfile[];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouteModalFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const assignedProfileId = useWatch({ control, name: "assignedProfileId", defaultValue: "" });

  const responsibleOptions = useMemo(() => {
    const currentId = String(ruta?.assignedProfileId || "");
    const currentLabel = ruta?.assignedProfileName?.trim() || ruta?.assignedUserName?.trim() || "";
    const activeProfiles = profiles.map((profile) => ({
      key: String(profile._id),
      label: String(profile.fullName || "Sin nombre"),
    }));
    if (currentId && currentLabel && !activeProfiles.some((option) => option.key === currentId)) {
      return [{ key: currentId, label: currentLabel }, ...activeProfiles];
    }
    return activeProfiles;
  }, [profiles, ruta?.assignedProfileId, ruta?.assignedProfileName, ruta?.assignedUserName]);

  const currentResponsibleLabel = useMemo(() => {
    if (!assignedProfileId) return "Sin responsable";
    return responsibleOptions.find((option) => option.key === assignedProfileId)?.label || "Responsable asignado";
  }, [assignedProfileId, responsibleOptions]);

  useEffect(() => {
    if (!isOpen) return;
    reset(ruta ? routeToFormValues(ruta) : DEFAULT_VALUES);
  }, [isOpen, ruta, reset]);

  const onFormSubmit = (data: RouteModalFormValues) => {
    onSubmit?.(data, ruta?.id);
    reset(DEFAULT_VALUES);
    onClose();
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
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
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-foreground">Responsable</label>
                    <select
                      value={field.value || ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                      className="h-11 w-full rounded-xl border border-default-200 bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Sin responsable</option>
                      {responsibleOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-default-500">
                      Actual: <span className="font-semibold text-default-700">{currentResponsibleLabel}</span>
                    </p>
                  </div>
                )}
              />
              <Controller
                name="deliveryType"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Tipo de entrega"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => field.onChange(String(Array.from(keys)[0] || "sucursal"))}
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
              startContent={isEdit ? <PencilSquareIcon className="size-5" /> : <PlusIcon className="size-5" />}
            >
              {isEdit ? "Guardar cambios" : "Crear ruta"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
