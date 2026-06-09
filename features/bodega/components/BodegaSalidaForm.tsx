"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/convex/_generated/api";
import { useRoles } from "@/shared/hooks";
import {
  cargaBodegaSchema,
  type CargaBodegaFormValues,
  getBodegaStatusOptionsByTipo,
} from "@/shared/schemas";
import type { SalidaRow } from "@/shared/mocks";

type BodegaSalidaFormProps = {
  salida?: SalidaRow | any | null;
  selectedWarehouseId: string;
  selectedWarehouseName: string;
  reservedFolio?: string;
  onSubmit: (data: any, editId?: string) => void;
  onCancel: () => void;
  canAssignResponsible?: boolean;
};

const defaultValues: CargaBodegaFormValues = {
  numeroCarga: "Se genera al guardar",
  fecha: new Date().toISOString().split("T")[0],
  status: "Listo para surtir",
  responsable: "",
  tipoEntrega: "sucursal",
  shippingMode: "pickup",
  productos: [],
  clientId: "",
  recipientType: "route",
  clienteDireccion: "",
  agente: "",
  almacen: "",
  ruta: "",
  destino: "",
  serie: "",
  clienteCodigo: "",
  clienteNombre: "",
  numeroDocumento: "",
};

const compactWarehouseFolio = (value?: string) => (value || "").replace(/-/g, "");

type TargetOption = {
  key: string;
  type: "route" | "wholesaler" | "retail";
  label: string;
  description: string;
  route?: any;
  client?: any;
};

function mapSalidaToFormValues(salida: any, productsById: Map<string, any>): CargaBodegaFormValues {
  return {
    numeroCarga: salida?.numeroSalida || salida?.numeroCarga || "Se genera al guardar",
    fecha: salida?.fecha || new Date().toISOString().split("T")[0],
    status: salida?.status || "Listo para surtir",
    responsable: salida?.responsable || "",
    tipoEntrega: salida?.tipoEntrega || "sucursal",
    shippingMode: salida?.shippingMode || ((salida?.tipoEntrega || "sucursal") === "pedido" ? "delivery" : "pickup"),
    clientId: salida?.clientId || "",
    recipientType: salida?.recipientType || undefined,
    productos: (salida?.productos || salida?.items || []).map((prod: any) => {
      const productId = String(prod.productId || prod.id || "");
      const product = productsById.get(productId);
      const cantidad = Number(prod.cantidad || prod.quantity || 1);
      const unitPrice = Number(prod.precio ?? prod.price ?? prod.finalPrice ?? 0);
      const subtotal = Number(prod.subtotal ?? unitPrice * cantidad);
      const basePrice = Number(prod.basePrice ?? unitPrice);
      return {
        id: prod.id || prod.productId,
        productId: prod.productId || prod.id,
        sku: prod.sku || product?.sku || "",
        descripcion: prod.descripcion || prod.name || product?.producto || "Producto",
        stock: Number(prod.stock || product?.stock || 0),
        sinStock: Boolean(prod.sinStock ?? Number(prod.stock || product?.stock || 0) <= 0),
        cantidad,
        precio: unitPrice,
        subtotal,
        basePrice,
        zoneMargin: Number(prod.zoneMargin ?? 0),
        discountPct: Number(prod.discountPct ?? 0),
        finalPrice: Number(prod.finalPrice ?? unitPrice),
        pricingSource: prod.pricingSource || "",
        pricingRuleVersion: Number(prod.pricingRuleVersion ?? 0),
        nombre: prod.nombre,
        categoria: prod.categoria || product?.categoria || "General",
        subcategoria: prod.subcategoria || "Sin Categoría",
        critico: Number(prod.critico || 10),
        bajo: Number(prod.bajo || 30),
        optimo: Number(prod.optimo || 50),
        etiqueta: prod.etiqueta || "Transparente",
      };
    }),
    clienteDireccion: salida?.clienteDireccion || "",
    agente: salida?.agente || "",
    almacen: salida?.almacen || "",
    bodegaId: salida?.bodegaId || "",
    ruta: salida?.ruta || "",
    destino: salida?.destino || "",
    serie: salida?.serie || "",
    clienteCodigo: salida?.clienteCodigo || "",
    clienteNombre: salida?.clienteNombre || "",
    numeroDocumento: salida?.numeroDocumento || "",
  };
}

export function BodegaSalidaForm({
  salida,
  selectedWarehouseId,
  selectedWarehouseName,
  reservedFolio,
  onSubmit,
  onCancel,
  canAssignResponsible = true,
}: BodegaSalidaFormProps) {
  const isEdit = !!salida;
  const { role } = useRoles();
  const normalizedRole = (role || "").trim().toLowerCase();
  const isSuperAdmin = normalizedRole === "superadmin" || normalizedRole === "super admin";

  const rawProducts = useQuery(api.products.queries.list) || [];
  const routes = useQuery(api.routes.queries.list) || [];
  const rawClients = useQuery(api.clients.queries.list);
  const clients = rawClients || [];

  const products = useMemo(() => {
    return rawProducts.map((raw) => {
      const p = raw as Record<string, unknown>;
      return {
        _id: String(p._id ?? ""),
        producto: String(p.producto ?? ""),
        sku: String(p.sku ?? ""),
        categoria: String(p.categoria ?? ""),
        lista1: String(p.lista1 ?? "0"),
        stock: Number(p.stock ?? 0),
      };
    });
  }, [rawProducts]);
  const productsById = useMemo(() => {
    return new Map(products.map((product) => [String(product._id), product]));
  }, [products]);
  const eligibleClients = useMemo(
    () =>
      clients.filter((client: any) => {
        const clientType = String(client.clientType || "commercial");
        return clientType === "wholesaler" || clientType === "retail";
      }),
    [clients]
  );
  const internalRoutes = useMemo(
    () => routes.filter((route: any) => String(route.routeType || "Interna") === "Interna"),
    [routes]
  );
  const targetOptions = useMemo<TargetOption[]>(() => {
    const routeOptions = internalRoutes.map((route: any) => ({
      key: `route:${String(route._id)}`,
      type: "route" as const,
      label: route.name || "Ruta interna",
      description: route.destination || "Ruta interna",
      route,
    }));
    const wholesalerOptions = eligibleClients
      .filter((client: any) => String(client.clientType) === "wholesaler")
      .map((client: any) => ({
        key: `client:${String(client._id)}`,
        type: "wholesaler" as const,
        label: client.commercialName || client.buyerName || "Cliente mayorista",
        description: client.townName || client.municipalityName || "Mayorista",
        client,
      }));
    const retailOptions = eligibleClients
      .filter((client: any) => String(client.clientType) === "retail")
      .map((client: any) => ({
        key: `client:${String(client._id)}`,
        type: "retail" as const,
        label: client.commercialName || client.buyerName || "Cliente minorista",
        description: "Público general",
        client,
      }));
    return [...routeOptions, ...wholesalerOptions, ...retailOptions];
  }, [eligibleClients, internalRoutes]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(cargaBodegaSchema) as any,
    defaultValues,
  });

  const tipoEntrega = useWatch({ control, name: "tipoEntrega", defaultValue: "sucursal" });
  const shippingMode = useWatch({ control, name: "shippingMode", defaultValue: "pickup" });
  const selectedRouteName = useWatch({ control, name: "ruta", defaultValue: "" });
  const statusOptions = useMemo(() => getBodegaStatusOptionsByTipo(tipoEntrega), [tipoEntrega]);
  const formItems = watch("productos") || [];
  const selectedClientId = useWatch({ control, name: "clientId", defaultValue: "" });
  const selectedClient = useMemo(
    () => clients.find((client: any) => String(client._id) === String(selectedClientId)) || null,
    [clients, selectedClientId]
  );
  const selectedRoute = useMemo(
    () => internalRoutes.find((route: any) => route.name === selectedRouteName) || null,
    [internalRoutes, selectedRouteName]
  );
  const selectedTargetKey = useMemo(() => {
    if (selectedRoute) return `route:${String(selectedRoute._id)}`;
    if (selectedClient) return `client:${String(selectedClient._id)}`;
    return "";
  }, [selectedClient, selectedRoute]);
  const selectedTarget = useMemo(
    () => targetOptions.find((option) => option.key === selectedTargetKey) || null,
    [selectedTargetKey, targetOptions]
  );
  const targetType = selectedTarget?.type || null;
  const isWholesalerTarget = targetType === "wholesaler";
  const isRetailTarget = targetType === "retail";
  const isRouteTarget = targetType === "route";
  const showPricingColumns = isWholesalerTarget;
  const totalLabel = isWholesalerTarget ? "Total Cotización" : "Cantidad Total";
  const showShippingSelector = isRouteTarget || isWholesalerTarget;

  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
  const [productInput, setProductInput] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const productInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!productInput) return [];
    return products.filter((p) =>
      `${p.producto} ${p.sku}`.toLowerCase().includes(productInput.toLowerCase())
    );
  }, [productInput, products]);

  useEffect(() => {
    if (filteredProducts.length > 0) setActiveIndex(0);
    else setActiveIndex(-1);
  }, [filteredProducts]);

  useEffect(() => {
    if (isEdit && salida) {
      reset(mapSalidaToFormValues(salida, productsById));
    }
  }, [isEdit, salida, reset, productsById]);

  useEffect(() => {
    if (isEdit) return;
    reset({
      ...defaultValues,
      numeroCarga: reservedFolio || "Se genera al guardar",
      almacen: selectedWarehouseName,
    });
    setValue("bodegaId", selectedWarehouseId);
  }, [isEdit, reset, reservedFolio, selectedWarehouseId, selectedWarehouseName, setValue]);

  useEffect(() => {
    if (!canAssignResponsible) {
      setValue("responsable", "Sin asignar");
    }
  }, [canAssignResponsible, setValue]);

  useEffect(() => {
    const currentStatus = watch("status");
    if (statusOptions.length > 0 && !statusOptions.includes(currentStatus)) {
      setValue("status", statusOptions[0]);
    }
  }, [setValue, statusOptions, watch]);

  useEffect(() => {
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 100);
  }, []);

  const montoTotalValue = useMemo(() => {
    return formItems.reduce((acc: number, p: any) => acc + Number(p.precio || 0) * Number(p.cantidad || 0), 0);
  }, [formItems]);
  const cantidadTotal = useMemo(() => {
    return formItems.reduce((acc: number, p: any) => acc + Number(p.cantidad || 0), 0);
  }, [formItems]);

  const montoTotalFormatted = useMemo(() => {
    return montoTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }, [montoTotalValue]);

  const applySelectedTarget = (targetKey: string) => {
    const target = targetOptions.find((option) => option.key === targetKey);
    if (!target) return;
    const nextType = target.type;
    const normalizedItems = formItems.map((item: any) => {
      const product = productsById.get(String(item.productId || item.id || ""));
      const nextPrice = nextType === "wholesaler" ? Number(product?.lista1 || 0) : 0;
      return {
        ...item,
        precio: nextPrice,
        basePrice: nextPrice,
        finalPrice: nextPrice,
        subtotal: Number(item.cantidad || 0) * nextPrice,
        pricingSource: nextType === "wholesaler" ? "legacy_lista1" : "",
        pricingRuleVersion: 0,
      };
    });
    setValue("productos", normalizedItems);

    if (target.type === "route") {
      const route = target.route;
      const nextShippingMode = route?.deliveryType === "envio" ? "delivery" : "pickup";
      setValue("shippingMode", nextShippingMode);
      setValue("tipoEntrega", nextShippingMode === "delivery" ? "pedido" : "sucursal");
      setValue("recipientType", "route");
      setValue("ruta", route?.name || "");
      setValue("destino", route?.destination || "");
      if (canAssignResponsible) {
        setValue("responsable", route?.assignedProfileName || route?.assignedUserName || "");
      }
      setValue("clientId", "");
      setValue("clienteNombre", route?.name || "Ruta interna");
      setValue("clienteCodigo", "");
      setValue("clienteDireccion", route?.destination || "");
      return;
    }

    const client = target.client;
    const nextShippingMode = target.type === "wholesaler"
      ? (client?.tipoEntrega === "delivery" ? "delivery" : "pickup")
      : "pickup";
    setValue("shippingMode", nextShippingMode);
    setValue("tipoEntrega", nextShippingMode === "delivery" ? "pedido" : "sucursal");
    setValue("recipientType", target.type);
    setValue("clientId", String(client?._id || ""));
    setValue("clienteNombre", client?.commercialName || client?.buyerName || "");
    setValue("clienteCodigo", String(client?._id || ""));
    setValue("ruta", "");
    if (target.type === "wholesaler") {
      setValue("destino", client?.townName || client?.municipalityName || "");
      setValue("clienteDireccion", client?.townName || client?.municipalityName || "");
      if (canAssignResponsible) {
        setValue("responsable", client?.responsable || client?.buyerName || "");
      }
    } else {
      setValue("destino", "");
      setValue("clienteDireccion", client?.commercialName || client?.buyerName || "Público general");
      if (canAssignResponsible) {
        setValue("responsable", client?.responsable || client?.buyerName || "Público general");
      }
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const qty = Math.max(1, parseInt(addQty || "1", 10) || 1);
    const price = isWholesalerTarget ? Number(selectedProduct.lista1 || 0) : 0;
    const existingIndex = formItems.findIndex((i: any) => i.productId === selectedProduct._id || i.id === selectedProduct._id);

    if (existingIndex >= 0) {
      const next = [...formItems];
      next[existingIndex] = {
        ...next[existingIndex],
        cantidad: Number(next[existingIndex].cantidad || 0) + qty,
      };
      setValue("productos", next);
    } else {
      setValue("productos", [
        ...formItems,
        {
          id: selectedProduct._id,
          productId: selectedProduct._id,
          sku: selectedProduct.sku,
          descripcion: selectedProduct.producto,
          stock: selectedProduct.stock,
          sinStock: selectedProduct.stock <= 0,
          cantidad: qty,
          precio: price,
          subtotal: qty * price,
          basePrice: price,
          zoneMargin: 0,
          discountPct: 0,
          finalPrice: price,
          pricingSource: isWholesalerTarget ? "legacy_lista1" : "",
          pricingRuleVersion: 0,
        },
      ]);
    }

    setSelectedProduct(null);
    setProductInput("");
    setAddQty("1");
    setShowResults(false);
    setTimeout(() => productInputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredProducts.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowResults(true);
      setActiveIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setShowResults(true);
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < filteredProducts.length) {
        e.preventDefault();
        const p = filteredProducts[activeIndex];
        setSelectedProduct(p);
        setProductInput(p.producto);
        setShowResults(false);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      }
    }
  };

  const onFormSubmit = (data: CargaBodegaFormValues) => {
    onSubmit(
      {
        ...data,
        bodegaId: selectedWarehouseId,
        almacen: selectedWarehouseName,
        totalAmount: montoTotalValue,
        productos: formItems,
        targetType,
        recipientType: targetType,
        shippingMode,
      },
      salida?._id ?? salida?.id
    );
  };

  return (
    <div className="mx-auto w-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-3 rounded-xl border border-default-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="flat" onPress={onCancel} className="rounded-full overflow-hidden">
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div>
            <h2 className="text-base font-semibold text-default-800 leading-none">
              {isEdit ? "Editar Salida" : "Registro de Salida"}
            </h2>
            <p className="text-[11px] text-default-400 mt-1">Captura rápida de productos</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-default-400 mb-1">
              {totalLabel}
            </span>
            <div className="flex items-center justify-center h-9 rounded-lg border border-primary/20 bg-primary/5 px-3">
              <span className="text-base font-bold text-primary leading-none">
                {isWholesalerTarget ? (
                  <>
                    <span className="text-xs mr-1 font-bold text-primary/60">$</span>
                    {montoTotalFormatted}
                  </>
                ) : (
                  `${cantidadTotal} pz`
                )}
              </span>
            </div>
          </div>
          <Button
            color="primary"
            size="md"
            className="rounded-lg font-semibold px-6"
            onPress={() => handleSubmit(onFormSubmit)()}
          >
            {isEdit ? "Guardar Cambios" : "Finalizar Registro"}
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3">
          <Input
            label="Almacén"
            value={selectedWarehouseName || "Bodega no seleccionada"}
            isReadOnly
            variant="bordered"
            size="sm"
            classNames={{ inputWrapper: "rounded-xl bg-default-50/60 min-h-10" }}
            startContent={<BuildingStorefrontIcon className="size-4 text-primary" />}
          />
          <Controller
            name="numeroCarga"
            control={control}
            render={({ field }) => (
              <Input
                label="Salida"
                variant="bordered"
                size="sm"
                value={compactWarehouseFolio(field.value || "") || "Pendiente"}
                onValueChange={field.onChange}
                isReadOnly={!isSuperAdmin}
                isDisabled={!isSuperAdmin}
                description={!isEdit ? "Se genera al guardar" : undefined}
                isInvalid={!!errors.numeroCarga}
                errorMessage={errors.numeroCarga?.message?.toString()}
                classNames={{ inputWrapper: "rounded-xl bg-default-50/60 min-h-10" }}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                variant="bordered"
                size="sm"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                classNames={{ trigger: "min-h-10 rounded-xl border-default-200 bg-default-50/60" }}
              >
                {statusOptions.map((s) => (
                  <SelectItem key={s}>{s}</SelectItem>
                ))}
              </Select>
            )}
          />
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <Input
                label="Fecha"
                type="date"
                variant="bordered"
                size="sm"
                value={field.value || ""}
                onValueChange={field.onChange}
                isInvalid={!!errors.fecha}
                errorMessage={errors.fecha?.message?.toString()}
                classNames={{ inputWrapper: "rounded-xl bg-default-50/60 min-h-10" }}
              />
            )}
          />
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3">
          <Controller
            name="targetKey"
            control={control}
            render={({ field }) => (
              <Select
                label="Destinatario"
                placeholder="Selecciona ruta interna, mayorista o minorista"
                variant="bordered"
                size="sm"
                selectedKeys={field.value ? [field.value] : selectedTargetKey ? [selectedTargetKey] : []}
                onSelectionChange={(keys) => {
                  const targetKey = String(Array.from(keys)[0] || "");
                  field.onChange(targetKey);
                  applySelectedTarget(targetKey);
                }}
                classNames={{ trigger: "min-h-10 rounded-xl border-default-200 bg-default-50/60" }}
              >
                {targetOptions.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    <div className="flex flex-col">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-tiny text-default-400">
                        {option.type === "route" ? `Ruta interna • ${option.description}` : option.type === "wholesaler" ? `Mayorista • ${option.description}` : `Minorista • ${option.description}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}
          />
          <Controller
            name="tipoEntrega"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo"
                variant="bordered"
                size="sm"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                classNames={{ trigger: "min-h-10 rounded-xl border-default-200 bg-default-50/60" }}
              >
                <SelectItem key="sucursal">Sucursal</SelectItem>
                <SelectItem key="pedido">Pedido</SelectItem>
              </Select>
            )}
          />
          {showShippingSelector ? (
            <Controller
              name="shippingMode"
              control={control}
              render={({ field }) => (
                <Select
                  label="Envío"
                  variant="bordered"
                  size="sm"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const nextValue = String(Array.from(keys)[0] || "pickup") as "delivery" | "pickup";
                    field.onChange(nextValue);
                    setValue("tipoEntrega", nextValue === "delivery" ? "pedido" : "sucursal");
                  }}
                  classNames={{ trigger: "min-h-10 rounded-xl border-default-200 bg-default-50/60" }}
                >
                  <SelectItem key="pickup">Sin envío</SelectItem>
                  <SelectItem key="delivery">Con envío</SelectItem>
                </Select>
              )}
            />
          ) : (
            <div className="rounded-xl border border-default-200 bg-default-50/60 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-default-400">Envío</p>
              <p className="mt-1 text-sm font-semibold text-default-700">No aplica</p>
            </div>
          )}
          <Controller
            name="destino"
            control={control}
            render={({ field }) => (
              <Input
                label="Destino"
                placeholder={isRetailTarget ? "No requerido para minorista" : "Destino"}
                variant="bordered"
                size="sm"
                value={field.value || ""}
                onValueChange={field.onChange}
                isReadOnly={isRouteTarget || isWholesalerTarget}
                classNames={{ inputWrapper: "rounded-xl bg-default-50/60 min-h-10" }}
              />
            )}
          />
          <Controller
            name="responsable"
            control={control}
            render={({ field }) => (
              <Input
                label="Responsable"
                placeholder="Nombre del responsable"
                variant="bordered"
                size="sm"
                value={field.value || ""}
                onValueChange={field.onChange}
                isReadOnly={isRouteTarget || isWholesalerTarget}
                isDisabled={!canAssignResponsible}
                isInvalid={!!errors.responsable}
                errorMessage={errors.responsable?.message?.toString()}
                classNames={{ inputWrapper: "rounded-xl bg-default-50/60 min-h-10" }}
              />
            )}
          />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 text-tiny text-default-500">
          <div>
            <span className="font-semibold text-default-700">Destinatario:</span>{" "}
            {selectedTarget?.label || watch("clienteNombre") || "Pendiente"}
          </div>
          <div>
            <span className="font-semibold text-default-700">Tipo:</span>{" "}
            {isRouteTarget ? "Ruta interna" : isWholesalerTarget ? "Mayorista" : isRetailTarget ? "Minorista" : "Pendiente"}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-default-200 shadow-sm space-y-4">
        <div className="flex gap-3 items-end">
          <div className="relative flex-1">
            <Input
              ref={productInputRef}
              label="Buscar producto"
              placeholder="Nombre o SKU"
              value={productInput}
              onValueChange={(value) => {
                setProductInput(value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={handleKeyDown}
            />
            {showResults && productInput && (
              <div className="absolute z-50 mt-1 max-h-[320px] w-full overflow-y-auto rounded-xl border border-default-200 bg-content1 p-1 shadow-xl">
                {filteredProducts.map((prod, index) => (
                  <button
                    key={prod._id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(prod);
                      setProductInput(prod.producto);
                      setShowResults(false);
                      setTimeout(() => qtyInputRef.current?.focus(), 50);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`group flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left transition-all ${
                      index === activeIndex ? "bg-primary text-white shadow-md" : "hover:bg-default-100"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-bold text-sm truncate max-w-[220px] lg:max-w-md">{prod.producto}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${index === activeIndex ? "bg-white/20" : "bg-default-100"}`}>
                          Stock: {prod.stock}
                        </span>
                        {showPricingColumns ? (
                          <span className={`font-bold ${index === activeIndex ? "text-white" : "text-primary"}`}>
                            ${Number(prod.lista1 || 0).toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <PlusIcon className={`size-5 ${index === activeIndex ? "text-white" : "text-primary"}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-28">
            <Input
              ref={qtyInputRef}
              label="Cant."
              type="number"
              min={1}
              value={addQty}
              onValueChange={setAddQty}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddProduct();
                }
              }}
            />
          </div>

          <Button
            isIconOnly
            color="primary"
            className="h-14 w-14 min-w-14 rounded-xl shadow-lg shadow-primary/20"
            onPress={handleAddProduct}
          >
            <PlusIcon className="size-6" />
          </Button>
        </div>

        <div className="max-h-[46vh] overflow-auto rounded-xl border border-default-100">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-default-100 bg-default-50 text-default-500">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                {showPricingColumns ? <th className="px-4 py-3 text-right font-semibold">Precio unitario</th> : null}
                {showPricingColumns ? <th className="px-4 py-3 text-right font-semibold">Subtotal</th> : null}
                {showPricingColumns ? <th className="px-4 py-3 text-right font-semibold">Fuente</th> : null}
                <th className="px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {formItems.map((prod: any, idx: number) => (
                <tr key={`${prod.productId || prod.id}-${idx}`} className="hover:bg-default-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{prod.sku || "-"}</td>
                  <td className="px-4 py-3 font-medium">{prod.descripcion || "Producto"}</td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      size="sm"
                      min={1}
                      className="max-w-24 ml-auto"
                      value={String(prod.cantidad || 1)}
                      onValueChange={(value) => {
                        const next = [...formItems];
                        next[idx] = { ...next[idx], cantidad: Math.max(1, parseInt(value || "1", 10) || 1) };
                        setValue("productos", next);
                      }}
                    />
                  </td>
                  {showPricingColumns ? (
                    <td className="px-4 py-3 text-right font-mono">${Number(prod.precio ?? prod.finalPrice ?? 0).toFixed(2)}</td>
                  ) : null}
                  {showPricingColumns ? (
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                      ${Number(prod.subtotal ?? Number(prod.precio ?? prod.finalPrice ?? 0) * Number(prod.cantidad || 0)).toFixed(2)}
                    </td>
                  ) : null}
                  {showPricingColumns ? (
                    <td className="px-4 py-3 text-right text-xs text-default-500">
                      {prod.pricingSource || (Number(prod.pricingRuleVersion || 0) > 0 ? "dynamic" : "legacy")}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => setValue("productos", formItems.filter((_: any, i: number) => i !== idx))}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {formItems.length === 0 && (
                <tr>
                  <td colSpan={showPricingColumns ? 7 : 4} className="px-4 py-10 text-center text-default-400 italic">
                    No hay productos agregados a la salida.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Controller
          name="clienteDireccion"
          control={control}
          render={({ field }) => (
            <Input
              label="Nota"
              placeholder="Observaciones de salida"
              variant="flat"
              value={field.value || ""}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}
