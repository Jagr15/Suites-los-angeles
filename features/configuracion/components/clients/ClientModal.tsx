import { useEffect, useMemo } from "react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
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
import { clientSchema, type ClientFormValues } from "@/shared/schemas";
import {
  DocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { CLIENT_TYPE_LABELS, DELIVERY_DAY_OPTIONS, DELIVERY_TYPE_LABELS, Client } from "./types";
import { StateSelector, MunicipalitySelector, LocalitySelector } from "@/shared/components/locations";
import { getAddressReferenceFromMapsUrl, getGoogleMapsEmbedSrc, parseCoordinatesFromMapsUrl } from "./location-utils";
import { parseTimeToCalendarDate, toHHmm } from "../../utils/time";
import {
  getAllowedCustomerLevelCodes,
  type FixedCustomerLevelCode,
} from "@/shared/pricing/customer-levels";

interface ClientModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedClient: Client | null;
  onSave: (data: ClientFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

type PricingLevelItem = {
  _id: string;
  code: string;
  name: string;
};

type PricingLevelSelectOption = {
  key: string;
  label: string;
};

const NO_PRICING_LEVEL_KEY = "__none__";

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

function toDateRangeBoundary(value?: string) {
  return parseTimeToCalendarDate(value);
}

export function ClientModal({
  isOpen,
  onOpenChange,
  selectedClient,
  onSave,
  onClose,
  isLoading,
}: ClientModalProps) {
  const routesRaw = useQuery(api.routes.queries.list);
  const activeRoutes = useQuery(api.routes.queries.listActiveForSelection) || [];
  const pricingLevelsRaw = useQuery(api.pricing.queries.listCustomerLevels);
  const routes = useMemo(() => routesRaw || [], [routesRaw]);
  const pricingLevels = useMemo(
    () => (pricingLevelsRaw || []) as PricingLevelItem[],
    [pricingLevelsRaw]
  );
  const pricingLevelsById = useMemo(() => {
    return new Map(pricingLevels.map((level) => [String(level._id), level] as const));
  }, [pricingLevels]);
  const pricingLevelsByCode = useMemo(() => {
    return new Map(pricingLevels.map((level) => [String(level.code).trim().toUpperCase(), level] as const));
  }, [pricingLevels]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as unknown as Resolver<ClientFormValues, unknown, ClientFormValues>,
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
      clientType: "commercial",
      tipoEntrega: "pickup",
      diaEntrega: "",
      responsable: "",
      townId: "",
      townName: "",
      municipalityId: "",
      municipalityName: "",
      stateId: "15",
      stateName: "México",
      pricingCustomerLevelId: "",
    },
  });

  const requiresInvoice = useWatch({ control, name: "requiresInvoice" });
  const clientType = useWatch({ control, name: "clientType" });
  const isRetail = clientType === "retail";
  const isWholesaler = clientType === "wholesaler";
  const municipalityId = useWatch({ control, name: "municipalityId" });
  const stateId = useWatch({ control, name: "stateId" });
  const pricingCustomerLevelId = useWatch({ control, name: "pricingCustomerLevelId" });
  const lat = useWatch({ control, name: "lat" });
  const lng = useWatch({ control, name: "lng" });
  const mapsUrl = useWatch({ control, name: "mapsUrl" });
  const availableScheduleEnd = useWatch({ control, name: "availableScheduleEnd" });
  const embedSrc = getGoogleMapsEmbedSrc(lat, lng, mapsUrl);
  const allowedCustomerLevelCodes = getAllowedCustomerLevelCodes(clientType || "commercial");
  const allowedPricingLevels = useMemo(
    () => pricingLevels.filter((level) => allowedCustomerLevelCodes.includes(String(level.code).trim().toUpperCase() as FixedCustomerLevelCode)),
    [allowedCustomerLevelCodes, pricingLevels]
  );
  const pricingLevelOptions = useMemo<PricingLevelSelectOption[]>(
    () => [
      { key: NO_PRICING_LEVEL_KEY, label: "Sin nivel" },
      ...allowedPricingLevels.map((level) => ({
        key: String(level._id),
        label: level.name,
      })),
    ],
    [allowedPricingLevels]
  );
  const selectedPricingLevelId = useMemo(() => {
    const rawValue = String(pricingCustomerLevelId || "").trim();
    if (!rawValue) return "";
    const byId = pricingLevelsById.get(rawValue);
    if (byId?.code) {
      const normalizedCode = String(byId.code).trim().toUpperCase() as FixedCustomerLevelCode;
      return allowedCustomerLevelCodes.includes(normalizedCode) ? rawValue : "";
    }
    const normalizedValue = rawValue.toUpperCase() as FixedCustomerLevelCode;
    const byCode = pricingLevelsByCode.get(normalizedValue);
    if (byCode?.code && allowedCustomerLevelCodes.includes(normalizedValue)) {
      return String(byCode._id);
    }
    return "";
  }, [allowedCustomerLevelCodes, pricingCustomerLevelId, pricingLevelsByCode, pricingLevelsById]);
  const selectedRouteId = useWatch({ control, name: "assignedRouteId" });
  const selectedRouteFromAll = useMemo(
    () => (selectedRouteId ? routes.find((route) => String(route._id) === String(selectedRouteId)) : null),
    [routes, selectedRouteId]
  );
  const routeOptions = useMemo(() => {
    const next = [...activeRoutes];
    if (selectedRouteFromAll && !next.some((route) => String(route._id) === String(selectedRouteFromAll._id))) {
      next.push(selectedRouteFromAll as any);
    }
    return next;
  }, [activeRoutes, selectedRouteFromAll]);
  useEffect(() => {
    if (!pricingCustomerLevelId) return;
    const rawValue = String(pricingCustomerLevelId).trim();
    const selectedLevel = pricingLevelsById.get(rawValue);
    const selectedCode = selectedLevel
      ? (String(selectedLevel.code).trim().toUpperCase() as FixedCustomerLevelCode)
      : (rawValue.toUpperCase() as FixedCustomerLevelCode);
    if (!allowedCustomerLevelCodes.includes(selectedCode)) {
      setValue("pricingCustomerLevelId", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [allowedCustomerLevelCodes, pricingCustomerLevelId, pricingLevelsById, setValue]);

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
          clientType: selectedClient.clientType || "commercial",
          commercialName: selectedClient.commercialName,
          buyerName: selectedClient.buyerName,
          responsable: selectedClient.responsable || selectedClient.buyerName,
          requiresInvoice: selectedClient.requiresInvoice,
          businessName: selectedClient.businessName,
          rfc: selectedClient.rfc,
          taxRegime: selectedClient.taxRegime,
          mapsUrl: getAddressReferenceFromMapsUrl(selectedClient.mapsUrl) || selectedClient.mapsUrl || "",
          lat: parsedCoords?.lat,
          lng: parsedCoords?.lng,
          townId: selectedClient.townId,
          townName: selectedClient.townName,
          municipalityId: selectedClient.municipalityId,
          municipalityName: selectedClient.municipalityName,
          stateId: selectedClient.stateId || "15",
          stateName: selectedClient.stateName || "México",
          pricingCustomerLevelId: selectedClient.pricingCustomerLevelId || "",
          visitFrequency: selectedClient.visitFrequency,
          tipoEntrega: selectedClient.tipoEntrega || "pickup",
          diaEntrega: selectedClient.diaEntrega || "",
          assignedRouteId: selectedClient.assignedRouteId,
          assignedRouteName: selectedClient.assignedRouteName,
          creditLimit: selectedClient.creditLimit,
          creditDays: selectedClient.creditDays,
          availableScheduleStart: selectedClient.availableScheduleStart,
          availableScheduleEnd: selectedClient.availableScheduleEnd,
        });
      } else {
        reset({
          clientType: "commercial",
          commercialName: "",
          buyerName: "",
          responsable: "",
          requiresInvoice: false,
          visitFrequency: "Semanal",
          tipoEntrega: "pickup",
          diaEntrega: "",
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
          pricingCustomerLevelId: "",
        });
      }
    }
  }, [isOpen, selectedClient, reset]);

  const onSubmit = (data: ClientFormValues) => {
    const address = getAddressReferenceFromMapsUrl(data.mapsUrl) || data.mapsUrl || "";
    const fullReference = buildAddressReference({
      address,
      townName: data.townName,
      municipalityName: data.municipalityName,
      stateName: data.stateName,
    });
    const normalizedMapsUrl = fullReference
      ? buildMapsSearchUrl(fullReference)
      : (data.mapsUrl || "");
    const normalizedClientType = data.clientType || "commercial";
    const normalizedResponsible = (data.responsable || data.buyerName || "").trim();
    const normalizedIsWholesaler = normalizedClientType === "wholesaler";
    const normalizedIsRetail = normalizedClientType === "retail";
    const normalizedPricingCustomerLevelId = normalizedIsRetail
      ? undefined
      : (
          pricingLevelsById.has(String(data.pricingCustomerLevelId || "").trim())
            ? String(data.pricingCustomerLevelId || "").trim()
            : pricingLevelsByCode.get(String(data.pricingCustomerLevelId || "").trim().toUpperCase())?._id
        );
    onSave({
      ...data,
      clientType: normalizedClientType,
      buyerName: normalizedIsRetail ? (data.commercialName || "").trim() : (data.buyerName || "").trim(),
      responsable: normalizedResponsible,
      requiresInvoice: normalizedIsRetail ? false : !!data.requiresInvoice,
      businessName: normalizedIsRetail ? undefined : data.businessName,
      rfc: normalizedIsRetail ? undefined : data.rfc,
      taxRegime: normalizedIsRetail ? undefined : data.taxRegime,
      mapsUrl: normalizedIsRetail ? "" : normalizedMapsUrl,
      townId: normalizedIsRetail ? "" : data.townId,
      townName: normalizedIsRetail ? "" : data.townName,
      municipalityId: normalizedIsRetail ? "" : data.municipalityId,
      municipalityName: normalizedIsRetail ? "" : data.municipalityName,
      stateId: normalizedIsRetail ? "" : data.stateId,
      stateName: normalizedIsRetail ? "" : data.stateName,
      pricingCustomerLevelId: normalizedPricingCustomerLevelId,
      visitFrequency: normalizedIsRetail ? "Semanal" : data.visitFrequency,
      assignedRouteId: normalizedIsRetail ? undefined : data.assignedRouteId,
      assignedRouteName: normalizedIsRetail ? undefined : data.assignedRouteName,
      creditLimit: normalizedIsRetail ? 0 : data.creditLimit,
      creditDays: normalizedIsRetail ? 0 : data.creditDays,
      availableScheduleStart: normalizedIsRetail ? undefined : data.availableScheduleStart,
      availableScheduleEnd: normalizedIsRetail ? undefined : data.availableScheduleEnd,
      tipoEntrega: normalizedIsWholesaler ? (data.tipoEntrega || "pickup") : undefined,
      diaEntrega: normalizedIsWholesaler ? (data.diaEntrega || "") : undefined,
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
        {() => (
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="flex flex-col max-h-full overflow-hidden"
          >
            <ModalHeader className="flex flex-col gap-1">
              {selectedClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6 py-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-small font-semibold text-foreground">Tipo de cliente</p>
                    <p className="text-tiny text-default-500">Selecciona cómo se comportará este cliente dentro del catálogo.</p>
                  </div>
                  <Controller
                    name="clientType"
                    control={control}
                    render={({ field }) => (
                      <Tabs
                        aria-label="Tipo de cliente"
                        color="primary"
                        variant="underlined"
                        selectedKey={field.value}
                        onSelectionChange={(key) => field.onChange(String(key))}
                      >
                        <Tab key="commercial" title={CLIENT_TYPE_LABELS.commercial} />
                        <Tab key="wholesaler" title={CLIENT_TYPE_LABELS.wholesaler} />
                        <Tab key="retail" title={CLIENT_TYPE_LABELS.retail} />
                      </Tabs>
                    )}
                  />
                </div>

                <Divider />

                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                  <Controller
                    name="commercialName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={isRetail ? "Nombre" : "Nombre Comercial"}
                        placeholder={isRetail ? "Público en general" : "Ej. Tienda El Porvenir"}
                        variant="bordered"
                        labelPlacement="outside"
                        isInvalid={!!errors.commercialName}
                        errorMessage={errors.commercialName?.message}
                      />
                    )}
                  />
                  {!isRetail ? (
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
                  ) : null}
                </div>

                {!isRetail ? (
                  <>
                    <Divider />

                    {/* Pricing Level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="pricingCustomerLevelId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            label="Nivel de pricing"
                            placeholder="Sin nivel"
                            variant="bordered"
                            labelPlacement="outside"
                            items={pricingLevelOptions}
                            selectedKeys={selectedPricingLevelId ? [selectedPricingLevelId] : []}
                            onSelectionChange={(keys) => {
                              const selectedKey = String(Array.from(keys)[0] || "");
                              field.onChange(selectedKey === NO_PRICING_LEVEL_KEY ? "" : selectedKey);
                            }}
                          >
                            {(item) => (
                              <SelectItem key={item.key} textValue={item.label}>
                                {item.label}
                              </SelectItem>
                            )}
                          </Select>
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
                              value={field.value || ""}
                              onValueChange={field.onChange}
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
                                municipalityId={municipalityId ?? null}
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
                          <div className="rounded-xl border border-default-200 bg-content1 p-2">
                            {embedSrc ? (
                              <div className="overflow-hidden rounded-lg border border-default-200">
                                <iframe
                                  title="Mapa de ubicación del cliente"
                                  src={embedSrc}
                                  className="h-40 w-full"
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                />
                              </div>
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-default-300 text-sm text-default-500">
                                Ubicación no registrada
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {!isRetail ? (
                  <>
                    <Divider />

                    {/* Operation / Delivery */}
                    <div className="space-y-4">
                      <h4 className="text-small font-semibold flex items-center gap-2">
                        <CalendarDaysIcon className="size-4 text-primary" />
                        {isWholesaler ? "Entrega Mayorista" : "Operación"}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isWholesaler ? (
                          <>
                            <Controller
                              name="tipoEntrega"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  label="Tipo de entrega"
                                  placeholder="Selecciona"
                                  variant="bordered"
                                  labelPlacement="outside"
                                  selectedKeys={field.value ? [field.value] : []}
                                  onSelectionChange={(keys) => field.onChange(String(Array.from(keys)[0] || ""))}
                                  isInvalid={!!errors.tipoEntrega}
                                  errorMessage={errors.tipoEntrega?.message}
                                >
                                  <SelectItem key="pickup" textValue={DELIVERY_TYPE_LABELS.pickup}>
                                    {DELIVERY_TYPE_LABELS.pickup}
                                  </SelectItem>
                                  <SelectItem key="delivery" textValue={DELIVERY_TYPE_LABELS.delivery}>
                                    {DELIVERY_TYPE_LABELS.delivery}
                                  </SelectItem>
                                </Select>
                              )}
                            />
                            <Controller
                              name="diaEntrega"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  label="Día de entrega"
                                  placeholder="Selecciona"
                                  variant="bordered"
                                  labelPlacement="outside"
                                  selectedKeys={field.value ? [field.value] : []}
                                  onSelectionChange={(keys) => field.onChange(String(Array.from(keys)[0] || ""))}
                                  isInvalid={!!errors.diaEntrega}
                                  errorMessage={errors.diaEntrega?.message}
                                >
                                  {DELIVERY_DAY_OPTIONS.map((day) => (
                                    <SelectItem key={day} textValue={day}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                            />
                          </>
                        ) : (
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
                                selectedKeys={[field.value || "Semanal"]}
                                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                              >
                                <SelectItem key="Semanal" textValue="Semanal">Semanal</SelectItem>
                                <SelectItem key="Quincenal" textValue="Quincenal">Quincenal</SelectItem>
                                <SelectItem key="Mensual" textValue="Mensual">Mensual</SelectItem>
                              </Select>
                            )}
                          />
                        )}

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
                                const r = routeOptions.find(route => route._id === id);
                                field.onChange(id || "");
                                setValue("assignedRouteName", r?.name || "");
                              }}
                            >
                              {routeOptions.map((r) => (
                                <AutocompleteItem key={r._id} textValue={r.name}>
                                  {r.name}
                                  {r.isActive === false ? " (Inactiva)" : ""}
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
                            const startBoundary = toDateRangeBoundary(field.value);
                            const endBoundary = toDateRangeBoundary(availableScheduleEnd);
                            return (
                              <DateRangePicker
                                label="Horario disponible"
                                variant="bordered"
                                labelPlacement="outside"
                                hideTimeZone
                                granularity="minute"
                                visibleMonths={1}
                                value={(
                                  startBoundary && endBoundary
                                    ? {
                                        start: startBoundary,
                                        end: endBoundary,
                                      }
                                    : null
                                ) as never}
                                onChange={(value) => {
                                  if (value) {
                                    const rangeValue = value as { start: unknown; end: unknown };
                                    field.onChange(toHHmm(rangeValue.start) || "");
                                    setValue("availableScheduleEnd", toHHmm(rangeValue.end) || "");
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
                  </>
                ) : null}
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
