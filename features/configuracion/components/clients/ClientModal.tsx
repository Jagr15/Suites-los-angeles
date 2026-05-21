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
  Switch,
  Divider,
  DateRangePicker,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { clientSchema, type ClientFormValues } from "@/shared/schemas";
import {
  DocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Client, ROUTES } from "./types";
import { StateSelector, MunicipalitySelector, LocalitySelector } from "@/shared/components/locations";
import { parseCoordinatesFromMapsUrl } from "./location-utils";

interface ClientModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedClient: Client | null;
  onSave: (data: ClientFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

function getAddressReferenceFromMapsUrl(mapsUrl?: string): string {
  const raw = (mapsUrl || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (!query) return "";
    const decoded = decodeURIComponent(query).trim();
    return decoded;
  } catch {
    return raw;
  }
}

function buildMapsSearchUrl(reference: string): string {
  const trimmed = reference.trim();
  if (!trimmed) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

function buildAddressReference(args: {
  address?: string;
  townName?: string;
  municipalityName?: string;
  stateName?: string;
}): string {
  const chunks = [args.address, args.townName, args.municipalityName, args.stateName]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return chunks.join(", ");
}

export function ClientModal({
  isOpen,
  onOpenChange,
  selectedClient,
  onSave,
  onClose,
  isLoading,
}: ClientModalProps) {
  const routes = useQuery(api.routes.queries.list) || [];

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      commercialName: "",
      buyerName: "",
      requiresInvoice: false,
      visitFrequency: "Semanal",
      creditLimit: 0,
      creditDays: 0,
      mapsUrl: "",
      lat: undefined,
      lng: undefined,
      townId: "",
      townName: "",
      municipalityId: "",
      municipalityName: "",
      stateId: "15",
      stateName: "México",
    },
  });

  const requiresInvoice = watch("requiresInvoice");
  const municipalityId = watch("municipalityId");
  const stateId = watch("stateId");
  const lat = watch("lat");
  const lng = watch("lng");
  const mapsUrl = watch("mapsUrl");
  const townName = watch("townName");
  const municipalityName = watch("municipalityName");
  const stateName = watch("stateName");

  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      const generated = buildMapsSearchUrl(`${lat},${lng}`);
      if (generated && mapsUrl !== generated) {
        setValue("mapsUrl", generated, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [lat, lng, mapsUrl, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (selectedClient) {
        const parsedCoords =
          (typeof selectedClient.lat === "number" && typeof selectedClient.lng === "number")
            ? { lat: selectedClient.lat, lng: selectedClient.lng }
            : parseCoordinatesFromMapsUrl(selectedClient.mapsUrl);
        reset({
          commercialName: selectedClient.commercialName,
          buyerName: selectedClient.buyerName,
          requiresInvoice: selectedClient.requiresInvoice,
          businessName: selectedClient.businessName,
          rfc: selectedClient.rfc,
          taxRegime: selectedClient.taxRegime,
          mapsUrl: selectedClient.mapsUrl,
          lat: parsedCoords?.lat,
          lng: parsedCoords?.lng,
          townId: selectedClient.townId,
          townName: selectedClient.townName,
          municipalityId: selectedClient.municipalityId,
          municipalityName: selectedClient.municipalityName,
          stateId: selectedClient.stateId || "15",
          stateName: selectedClient.stateName || "México",
          visitFrequency: selectedClient.visitFrequency,
          assignedRouteId: selectedClient.assignedRouteId,
          assignedRouteName: selectedClient.assignedRouteName,
          creditLimit: selectedClient.creditLimit,
          creditDays: selectedClient.creditDays,
          availableScheduleStart: selectedClient.availableScheduleStart,
          availableScheduleEnd: selectedClient.availableScheduleEnd,
        });
      } else {
        reset({
          commercialName: "",
          buyerName: "",
          requiresInvoice: false,
          visitFrequency: "Semanal",
          creditLimit: 0,
          creditDays: 0,
          mapsUrl: "",
          lat: undefined,
          lng: undefined,
          townId: "",
          townName: "",
          municipalityId: "",
          municipalityName: "",
          stateId: "15",
          stateName: "México",
        });
      }
    }
  }, [isOpen, selectedClient, reset]);

  const onSubmit = (data: ClientFormValues) => {
    const address = getAddressReferenceFromMapsUrl(data.mapsUrl);
    const fullReference = buildAddressReference({
      address,
      townName: data.townName,
      municipalityName: data.municipalityName,
      stateName: data.stateName,
    });
    const normalizedMapsUrl = fullReference
      ? buildMapsSearchUrl(fullReference)
      : (data.mapsUrl || "");
    onSave({
      ...data,
      mapsUrl: normalizedMapsUrl,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(internalOnClose) => (
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="flex flex-col max-h-full overflow-hidden"
          >
            <ModalHeader className="flex flex-col gap-1">
              {selectedClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6 py-2">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="commercialName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Nombre Comercial"
                        placeholder="Ej. Tienda El Porvenir"
                        variant="bordered"
                        labelPlacement="outside"
                        isInvalid={!!errors.commercialName}
                        errorMessage={errors.commercialName?.message}
                      />
                    )}
                  />
                  <Controller
                    name="buyerName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Encargado de Compras"
                        placeholder="Nombre completo"
                        variant="bordered"
                        labelPlacement="outside"
                        isInvalid={!!errors.buyerName}
                        errorMessage={errors.buyerName?.message}
                      />
                    )}
                  />
                </div>

                <Divider />

                {/* Billing Toggle and Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentCheckIcon className="size-5 text-primary" />
                      <h4 className="text-small font-semibold">Datos de Facturación</h4>
                    </div>
                    <Controller
                      name="requiresInvoice"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          size="sm"
                          isSelected={field.value}
                          onValueChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  
                  {requiresInvoice && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <Controller
                        name="businessName"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Razón Social"
                            placeholder="RFC o Nombre Fiscal"
                            variant="bordered"
                            labelPlacement="outside"
                            isRequired
                          />
                        )}
                      />
                      <Controller
                        name="rfc"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="RFC"
                            placeholder="ABCJ123456XXX"
                            variant="bordered"
                            labelPlacement="outside"
                            isRequired
                          />
                        )}
                      />
                      <Controller
                        name="taxRegime"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Régimen Fiscal"
                            placeholder="Selecciona régimen"
                            variant="bordered"
                            labelPlacement="outside"
                            isRequired
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                          >
                            <SelectItem key="Persona Física" textValue="Persona Física">Persona Física</SelectItem>
                            <SelectItem key="MORAL" textValue="Persona Moral">Personas Morales</SelectItem>
                            <SelectItem key="RESICO" textValue="RESICO">RESICO</SelectItem>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Divider />

                {/* Location and Zone */}
                <div className="space-y-4">
                  <h4 className="text-small font-semibold flex items-center gap-2">
                    <MapPinIcon className="size-4 text-primary" />
                    Ubicación y Zona
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="mapsUrl"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Dirección o referencia (opcional)"
                          placeholder="Colonia, calle, punto de referencia"
                          variant="bordered"
                          labelPlacement="outside"
                          value={getAddressReferenceFromMapsUrl(field.value)}
                          onValueChange={(value) => {
                            field.onChange(buildMapsSearchUrl(value));
                          }}
                          isInvalid={!!errors.mapsUrl}
                          errorMessage={errors.mapsUrl?.message}
                        />
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        name="stateId"
                        control={control}
                        render={({ field }) => (
                          <StateSelector 
                            selectedKey={field.value}
                            onSelectionChange={(id, name) => {
                              field.onChange(id);
                              setValue("stateName", name, { shouldValidate: true, shouldDirty: true });
                              setValue("municipalityId", "", { shouldValidate: true, shouldDirty: true });
                              setValue("municipalityName", "", { shouldValidate: true, shouldDirty: true });
                              setValue("townId", "", { shouldValidate: true, shouldDirty: true });
                              setValue("townName", "", { shouldValidate: true, shouldDirty: true });
                            }}
                          />
                        )}
                      />
                      {errors.stateId ? (
                        <p className="col-span-2 text-danger text-tiny">{errors.stateId.message}</p>
                      ) : null}
                      <Controller
                        name="municipalityId"
                        control={control}
                        render={({ field }) => (
                          <MunicipalitySelector 
                            stateId={stateId ?? undefined}
                            selectedKey={field.value}
                            onSelectionChange={(id, name) => {
                              field.onChange(id);
                              setValue("municipalityName", name, { shouldValidate: true, shouldDirty: true });
                              setValue("townId", "", { shouldValidate: true, shouldDirty: true });
                              setValue("townName", "", { shouldValidate: true, shouldDirty: true });
                            }}
                          />
                        )}
                      />
                      {errors.municipalityId ? (
                        <p className="col-span-2 text-danger text-tiny">{errors.municipalityId.message}</p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        name="townId"
                        control={control}
                        render={({ field }) => (
                          <LocalitySelector 
                            stateId={stateId ?? null}
                            municipalityId={municipalityId}
                            selectedKey={field.value ?? undefined}
                            onSelectionChange={(id, name) => {
                              field.onChange(id);
                              setValue("townName", name, { shouldValidate: true, shouldDirty: true });
                            }}
                          />
                        )}
                      />
                      {errors.townId ? (
                        <p className="col-span-2 text-danger text-tiny">{errors.townId.message}</p>
                      ) : null}
                      <Controller
                        name="townName"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Zona"
                            placeholder="Zona / localidad"
                            variant="bordered"
                            labelPlacement="outside"
                            isReadOnly
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-tiny text-default-500">
                        La ubicación exacta puede agregarse posteriormente.
                      </p>
                      {mapsUrl ? (
                        <Button
                          as="a"
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="flat"
                          className="mt-2"
                        >
                          Abrir en Google Maps
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Operations */}
                <div className="space-y-4">
                  <h4 className="text-small font-semibold flex items-center gap-2">
                    <CalendarDaysIcon className="size-4 text-primary" />
                    Operación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="visitFrequency"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Frecuencia de Visita"
                          placeholder="Selecciona"
                          variant="bordered"
                          labelPlacement="outside"
                          selectedKeys={[field.value]}
                          onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                        >
                          <SelectItem key="Semanal" textValue="Semanal">Semanal</SelectItem>
                          <SelectItem key="Quincenal" textValue="Quincenal">Quincenal</SelectItem>
                          <SelectItem key="Mensual" textValue="Mensual">Mensual</SelectItem>
                        </Select>
                      )}
                    />
                    <Controller
                      name="assignedRouteId"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          label="Ruta Asignada"
                          placeholder="Busca o selecciona ruta"
                          variant="bordered"
                          labelPlacement="outside"
                          selectedKey={field.value || null}
                          onSelectionChange={(key) => {
                            const id = key as string;
                            const r = routes.find(route => route._id === id);
                            field.onChange(id || "");
                            setValue("assignedRouteName", r?.name || "");
                          }}
                        >
                          {routes.map((r) => (
                            <AutocompleteItem key={r._id} textValue={r.name}>
                              {r.name}
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Controller
                      name="availableScheduleStart"
                      control={control}
                      render={({ field }) => {
                        const end = watch("availableScheduleEnd");
                        return (
                          <DateRangePicker
                            label="Horario disponible"
                            variant="bordered"
                            labelPlacement="outside"
                            hideTimeZone
                            granularity="minute"
                            visibleMonths={1}
                            value={(
                              field.value && end
                                ? {
                                    start: parseAbsoluteToLocal(field.value),
                                    end: parseAbsoluteToLocal(end),
                                  }
                                : null
                            ) as any}
                            onChange={(value: any) => {
                              if (value) {
                                field.onChange(value.start?.toDate?.().toISOString?.() || "");
                                setValue("availableScheduleEnd", value.end?.toDate?.().toISOString?.() || "");
                              } else {
                                field.onChange(undefined);
                                setValue("availableScheduleEnd", undefined);
                              }
                            }}
                          />
                        );
                      }}
                    />
                  </div>
                </div>

                <Divider />

                {/* Commercial Conditions */}
                <div className="space-y-4">
                  <h4 className="text-small font-semibold flex items-center gap-2">
                    <CurrencyDollarIcon className="size-4 text-primary" />
                    Condiciones Comerciales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="creditLimit"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="Límite de Crédito"
                          placeholder="50000.00"
                          variant="bordered"
                          labelPlacement="outside"
                          startContent={<span className="text-default-400">$</span>}
                          value={field.value?.toString()}
                          onValueChange={(v) => field.onChange(parseFloat(v) || 0)}
                        />
                      )}
                    />
                    <Controller
                      name="creditDays"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="Días de Crédito"
                          placeholder="30"
                          variant="bordered"
                          labelPlacement="outside"
                          value={field.value?.toString()}
                          onValueChange={(v) => field.onChange(parseInt(v) || 0)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit" isLoading={isLoading}>
                {selectedClient ? "Guardar Cambios" : "Registrar Cliente"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
