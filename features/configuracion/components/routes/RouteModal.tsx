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
  Divider,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarIcon, PlusIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route, DAYS, routeSchema, RouteSchema } from "./types";
import { VehicleModal } from "./VehicleModal";
import { useRoutes } from "./use-routes";
import { RouteLocationPicker } from "./RouteLocationPicker";

interface RouteModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedRoute: Route | null;
  onClose: () => void;
}

export function RouteModal({
  isOpen,
  onOpenChange,
  selectedRoute,
  onClose,
}: RouteModalProps) {
  const profiles = useQuery(api.profiles.queries.listAll);
  const assets = useQuery(api.assets.queries.list);
  const { addRoute, updateRoute } = useRoutes();
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Obtener todos los clientes para mostrar en el mapa
  const allClients = useQuery(api.clients.queries.list);
  
  // Obtener clientes asignados a esta ruta
  const routeClients = (allClients || []).filter(c => c.assignedRouteId === selectedRoute?.id);
  
  const updateClientMutation = useMutation(api.clients.mutations.update);
  const updateVisitOrder = useMutation(api.clients.mutations.updateVisitOrder);

  // Filtrar solo activos de tipo transporte
  const transportAssets = (assets || []).filter(a => a.category === "Equipo de Transporte");

  const { 
    isOpen: isVehicleModalOpen, 
    onOpen: onVehicleModalOpen, 
    onOpenChange: onVehicleModalOpenChange 
  } = useDisclosure();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteSchema>({
    resolver: zodResolver(routeSchema) as any,
    defaultValues: {
      name: "",
      destination: "",
      deliveryType: "sucursal",
      assignedProfileId: "",
      assetId: "",
      operationDays: [],
      loadDay: "",
      isActive: true,
      requireGpsValidation: false,
      gpsRadiusLimit: 100,
      allowLocationUpdate: false,
      requireKmTracking: false,
      allowOffHoursSales: false,
      requireVisitOrder: false,
      allowNoSaleCheckIn: true,
      requireMinVisitTime: false,
      minVisitTimeMinutes: 5,
      startLat: 19.24,
      startLng: -103.73,
      stops: [],
    },
  });

  useEffect(() => {
    if (selectedRoute) {
      reset({
        name: selectedRoute.name,
        destination: selectedRoute.destination,
        deliveryType: selectedRoute.deliveryType,
        assignedProfileId: selectedRoute.assignedProfileId,
        assetId: selectedRoute.assetId,
        operationDays: selectedRoute.operationDays,
        loadDay: selectedRoute.loadDay,
        isActive: selectedRoute.isActive,
        requireGpsValidation: selectedRoute.requireGpsValidation ?? false,
        gpsRadiusLimit: selectedRoute.gpsRadiusLimit ?? 100,
        allowLocationUpdate: selectedRoute.allowLocationUpdate ?? false,
        requireKmTracking: selectedRoute.requireKmTracking ?? false,
        allowOffHoursSales: selectedRoute.allowOffHoursSales ?? false,
        requireVisitOrder: selectedRoute.requireVisitOrder ?? false,
        allowNoSaleCheckIn: selectedRoute.allowNoSaleCheckIn ?? true,
        requireMinVisitTime: selectedRoute.requireMinVisitTime ?? false,
        minVisitTimeMinutes: selectedRoute.minVisitTimeMinutes ?? 5,
        startLat: selectedRoute.startLat ?? 19.24,
        startLng: selectedRoute.startLng ?? -103.73,
        stops: selectedRoute.stops ?? [],
      });
    } else {
      reset({
        name: "",
        destination: "",
        deliveryType: "sucursal",
        assignedProfileId: "",
        assetId: "",
        operationDays: [],
        loadDay: "",
        isActive: true,
        requireGpsValidation: false,
        gpsRadiusLimit: 100,
        allowLocationUpdate: false,
        requireKmTracking: false,
        allowOffHoursSales: false,
        requireVisitOrder: false,
        allowNoSaleCheckIn: true,
        requireMinVisitTime: false,
        minVisitTimeMinutes: 5,
        startLat: 19.24,
        startLng: -103.73,
        stops: [],
      });
    }
  }, [selectedRoute, reset, isOpen]);

  const handleVehicleCreated = (vehicleId: string) => {
    console.log("[ROUTE] vehicle created assetId", vehicleId);
    setValue("assetId", vehicleId, { shouldValidate: true });
    console.log("[ROUTE] assetId auto-selected in form", vehicleId);
    addToast({
      title: "Vehículo y Activo Creados",
      description: "El nuevo transporte fue seleccionado en esta ruta.",
      color: "success",
    });
  };

  const handleAssignClient = async (clientId: string, assign: boolean) => {
    if (!selectedRoute) return;
    try {
      const client = allClients?.find(c => c._id === clientId);
      if (!client) return;

      await updateClientMutation({
        id: clientId as Id<"clients">,
        ...client,
        assignedRouteId: assign ? (selectedRoute.id as Id<"routes">) : undefined,
        assignedRouteName: assign ? selectedRoute.name : undefined,
      });

      addToast({
        title: assign ? "Cliente Agregado" : "Cliente Removido",
        description: `${client.commercialName} ha sido ${assign ? "agregado a" : "removido de"} la ruta.`,
        color: assign ? "success" : "warning",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo actualizar la asignación del cliente.",
        color: "danger",
      });
    }
  };

  const handleOrderChange = async (orderedIds: string[]) => {
    try {
      await updateVisitOrder({ orderedIds: orderedIds as Id<"clients">[] });
      addToast({
        title: "Ruta Optimizada",
        description: "El orden de visita ha sido actualizado correctamente.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo actualizar el orden de la ruta.",
        color: "danger",
      });
    }
  };

  const onSubmit = async (data: RouteSchema) => {
    setIsSaving(true);
    try {
      if (selectedRoute) {
        await updateRoute(selectedRoute.id, data);
        addToast({
          title: "Ruta Actualizada",
          description: "La planificación se guardó con éxito.",
          color: "success",
        });
      } else {
        await addRoute(data);
        addToast({
          title: "Ruta Registrada",
          description: "La nueva ruta de distribución ha sido creada.",
          color: "success",
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving route:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Falla al procesar los datos de la ruta.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const mappedClients = (routeClients || []).map(c => ({
    id: c._id,
    name: c.commercialName,
    lat: c.lat || 0,
    lng: c.lng || 0,
    visitOrder: c.visitOrder,
    assignedRouteId: c.assignedRouteId,
  })).filter(c => c.lat !== 0);

  const mappedAllClients = (allClients || []).map(c => ({
    id: c._id,
    name: c.commercialName,
    lat: c.lat || 0,
    lng: c.lng || 0,
    assignedRouteId: c.assignedRouteId,
  })).filter(c => c.lat !== 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(internalOnClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedRoute ? "Editar Ruta" : "Registrar Nueva Ruta"}
                <span className="text-tiny text-default-500 font-normal">
                  {selectedRoute ? "Gestiona la planeación del recorrido actual" : "Define un nuevo trayecto y asigna recursos"}
                </span>
              </ModalHeader>
              <ModalBody>
                <form id="route-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 py-2">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Panel Izquierdo: Configuración General (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Nombre de la Ruta"
                              placeholder="Ej. Ruta 001"
                              variant="bordered"
                              labelPlacement="outside"
                              isRequired
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
                              {...field}
                              label="Destino de la Ruta"
                              placeholder="Ej. Manzanillo"
                              variant="bordered"
                              labelPlacement="outside"
                              isRequired
                              isInvalid={!!errors.destination}
                              errorMessage={errors.destination?.message?.toString()}
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                          name="deliveryType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Tipo de Entrega"
                              placeholder="Selecciona tipo"
                              variant="bordered"
                              labelPlacement="outside"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const val = Array.from(keys)[0] as "sucursal" | "envio";
                                field.onChange(val);
                              }}
                              isRequired
                              isInvalid={!!errors.deliveryType}
                              errorMessage={errors.deliveryType?.message}
                            >
                              <SelectItem key="sucursal" textValue="Sucursal">Sucursal</SelectItem>
                              <SelectItem key="envio" textValue="Envío">Envío</SelectItem>
                            </Select>
                          )}
                        />

                        <Controller
                          name="assignedProfileId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Responsable (Perfil)"
                              placeholder="Selecciona un responsable"
                              variant="bordered"
                              labelPlacement="outside"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const val = Array.from(keys)[0] as string;
                                field.onChange(val);
                              }}
                              isLoading={profiles === undefined}
                              isRequired
                              isInvalid={!!errors.assignedProfileId}
                              errorMessage={errors.assignedProfileId?.message}
                            >
                              {(profiles || []).map((p) => (
                                <SelectItem key={p._id} textValue={p.fullName}>
                                  {p.fullName}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <Controller
                          name="assetId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Transporte Asignado (Activo)"
                              placeholder="Selecciona un transporte"
                              variant="bordered"
                              labelPlacement="outside"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const val = Array.from(keys)[0] as string;
                                field.onChange(val);
                              }}
                              isLoading={assets === undefined}
                              className="flex-1"
                              isRequired
                              isInvalid={!!errors.assetId}
                              errorMessage={errors.assetId?.message}
                            >
                              {transportAssets.map((a) => (
                                <SelectItem key={a._id} textValue={`${a.name} ${a.plate ? `(${a.plate})` : ""}`}>
                                  <div className="flex justify-between items-center w-full">
                                    <span>{a.name}</span>
                                    {a.plate && <span className="text-tiny text-default-400 font-mono">{a.plate}</span>}
                                  </div>
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                        <Button
                          isIconOnly
                          variant="flat"
                          color="primary"
                          className="mb-[2px]"
                          onPress={onVehicleModalOpen}
                        >
                          <PlusIcon className="size-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                          name="operationDays"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Días de Operación"
                              placeholder="Selecciona días"
                              variant="bordered"
                              labelPlacement="outside"
                              selectionMode="multiple"
                              selectedKeys={new Set(field.value || [])}
                              onSelectionChange={(keys) => {
                                field.onChange(Array.from(keys));
                              }}
                              isRequired
                              isInvalid={!!errors.operationDays}
                              errorMessage={errors.operationDays?.message}
                            >
                              {DAYS.map((day) => (
                                <SelectItem key={day.key} textValue={day.label}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                        <Controller
                          name="loadDay"
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="Día de Carga"
                              placeholder="Selecciona día"
                              variant="bordered"
                              labelPlacement="outside"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const val = Array.from(keys)[0] as string;
                                field.onChange(val);
                              }}
                              isRequired
                              isInvalid={!!errors.loadDay}
                              errorMessage={errors.loadDay?.message}
                            >
                              {DAYS.map((day) => (
                                <SelectItem key={day.key} textValue={day.label}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>

                      <Divider />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-small font-medium text-default-700">Estado de la Ruta</span>
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

                        <div className="flex items-center justify-between px-1">
                          <div className="flex-col">
                            <span className="text-small font-medium text-default-700">Venta solo en ubicación del cliente</span>
                            <span className="text-tiny text-default-400">Restringir por GPS</span>
                          </div>
                          <Controller
                            name="requireGpsValidation"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isSelected={field.value}
                                onValueChange={field.onChange}
                                color="warning"
                                size="sm"
                              />
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-small font-medium text-default-700">Registro KM</span>
                            <span className="text-tiny text-default-400">Exigir odómetro</span>
                          </div>
                          <Controller
                            name="requireKmTracking"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isSelected={field.value}
                                onValueChange={field.onChange}
                                color="primary"
                                size="sm"
                              />
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-small font-medium text-default-700">Venta Off-Hours</span>
                            <span className="text-tiny text-default-400">Permitir fuera de horario</span>
                          </div>
                          <Controller
                            name="allowOffHoursSales"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isSelected={field.value}
                                onValueChange={field.onChange}
                                color="danger"
                                size="sm"
                              />
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-small font-medium text-default-700">Orden de Visita</span>
                            <span className="text-tiny text-default-400">Seguir secuencia</span>
                          </div>
                          <Controller
                            name="requireVisitOrder"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isSelected={field.value}
                                onValueChange={field.onChange}
                                color="primary"
                                size="sm"
                              />
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-small font-medium text-default-700">Check-in sin venta</span>
                            <span className="text-tiny text-default-400">Permitir visitas vacías</span>
                          </div>
                          <Controller
                            name="allowNoSaleCheckIn"
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
                      </div>
                    </div>

                    {/* Panel Derecho: Mapa y Geovallado (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="size-4 text-primary" />
                          <span className="text-small font-bold text-foreground">Gestión de Destinos y Ruta</span>
                        </div>
                        <span className="text-tiny text-default-500 italic">Haz clic en un cliente para agregarlo o usa "Agregar Parada"</span>
                      </div>
                      
                      <Controller
                        name="startLat"
                        control={control}
                        render={({ field: latField }) => (
                          <Controller
                            name="startLng"
                            control={control}
                            render={({ field: lngField }) => (
                              <Controller
                                name="stops"
                                control={control}
                                render={({ field: stopsField }) => (
                                  <RouteLocationPicker
                                    lat={latField.value}
                                    lng={lngField.value}
                                    clients={mappedClients}
                                    allClients={mappedAllClients}
                                    stops={stopsField.value}
                                    currentRouteId={selectedRoute?.id}
                                    onChange={(lat, lng) => {
                                      setValue("startLat", lat);
                                      setValue("startLng", lng);
                                    }}
                                    onOrderChange={handleOrderChange}
                                    onAssignClient={handleAssignClient}
                                    onStopsChange={(stops) => setValue("stops", stops)}
                                    height="320px"
                                  />
                                )}
                              />
                            )}
                          />
                        )}
                      />

                      <div className="bg-default-50 p-4 rounded-2xl border border-default-200 space-y-4 shadow-inner">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-default-400 uppercase tracking-widest leading-none">Parámetros de Geovallado</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Controller
                            name="gpsRadiusLimit"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Radio (Metros)"
                                type="number"
                                variant="flat"
                                size="sm"
                                labelPlacement="outside"
                                isInvalid={!!errors.gpsRadiusLimit}
                                errorMessage={errors.gpsRadiusLimit?.message?.toString()}
                                value={field.value?.toString() ?? ""}
                                onValueChange={(value) => field.onChange(Number(value) || 0)}
                              />
                            )}
                          />
                          <Controller
                            name="minVisitTimeMinutes"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Tiempo Visita (Min)"
                                type="number"
                                variant="flat"
                                size="sm"
                                labelPlacement="outside"
                                isInvalid={!!errors.minVisitTimeMinutes}
                                errorMessage={errors.minVisitTimeMinutes?.message?.toString()}
                                value={field.value?.toString() ?? ""}
                                onValueChange={(value) => field.onChange(Number(value) || 0)}
                              />
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-tiny font-medium text-default-700">Actualizar Ubicación</span>
                            <span className="text-[10px] text-default-400">Vendedor puede corregir GPS</span>
                          </div>
                          <Controller
                            name="allowLocationUpdate"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isSelected={field.value}
                                onValueChange={field.onChange}
                                color="secondary"
                                size="sm"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter className="border-t border-divider py-4">
                <Button color="danger" variant="light" onPress={onClose} isDisabled={isSaving}>
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  form="route-form"
                  type="submit"
                  isLoading={isSaving} 
                  className="font-semibold px-8 shadow-md"
                >
                  {selectedRoute ? "Actualizar Plan" : "Crear Ruta"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <VehicleModal 
        isOpen={isVehicleModalOpen} 
        onOpenChange={onVehicleModalOpenChange}
        onSuccess={handleVehicleCreated}
      />
    </>
  );
}
