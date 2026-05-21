"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  TruckIcon,
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
  productos: [],
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

function mapSalidaToFormValues(salida: any): CargaBodegaFormValues {
  return {
    numeroCarga: salida?.numeroSalida || salida?.numeroCarga || "Se genera al guardar",
    fecha: salida?.fecha || new Date().toISOString().split("T")[0],
    status: salida?.status || "Listo para surtir",
    responsable: salida?.responsable || "",
    tipoEntrega: salida?.tipoEntrega || "sucursal",
    productos: (salida?.productos || salida?.items || []).map((prod: any) => ({
      id: prod.id || prod.productId,
      productId: prod.productId || prod.id,
      sku: prod.sku || "",
      descripcion: prod.descripcion || prod.name || "Producto",
      stock: Number(prod.stock || 0),
      sinStock: Boolean(prod.sinStock ?? Number(prod.stock || 0) <= 0),
      cantidad: Number(prod.cantidad || prod.quantity || 1),
      precio: Number(prod.precio || prod.price || 0),
      nombre: prod.nombre,
      categoria: prod.categoria || "General",
      subcategoria: prod.subcategoria || "Sin Categoría",
      critico: Number(prod.critico || 10),
      bajo: Number(prod.bajo || 30),
      optimo: Number(prod.optimo || 50),
      etiqueta: prod.etiqueta || "Transparente",
    })),
    clienteDireccion: salida?.clienteDireccion || "",
    agente: salida?.agente || "",
    almacen: salida?.almacen || "",
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
  onSubmit,
  onCancel,
  canAssignResponsible = true,
}: BodegaSalidaFormProps) {
  const isEdit = !!salida;
  const { role } = useRoles();
  const normalizedRole = (role || "").trim().toLowerCase();
  const isSuperAdmin = normalizedRole === "superadmin" || normalizedRole === "super admin";

  const rawProducts = useQuery(api.products.queries.list) || [];
  const bodegas = useQuery(api.bodegas.queries.list) || [];

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
  const statusOptions = useMemo(() => getBodegaStatusOptionsByTipo(tipoEntrega), [tipoEntrega]);
  const formItems = watch("productos") || [];

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
      reset(mapSalidaToFormValues(salida));
    } else {
      reset(defaultValues);
    }
  }, [isEdit, salida, reset]);

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

  const montoTotalFormatted = useMemo(() => {
    return montoTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }, [montoTotalValue]);

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const qty = Math.max(1, parseInt(addQty || "1", 10) || 1);
    const price = Number(selectedProduct.lista1 || 0);
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
        totalAmount: montoTotalValue,
        productos: formItems,
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
            <p className="text-[11px] text-default-400 mt-1">Complete la información del documento</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-default-400 mb-1">Monto Total</span>
            <div className="flex items-center justify-center h-9 rounded-lg border border-primary/20 bg-primary/5 px-3">
              <span className="text-base font-bold text-primary leading-none">
                <span className="text-xs mr-1 font-bold text-primary/60">$</span>
                {montoTotalFormatted}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm transition-all group">
          <div className="flex items-center gap-2 mb-3 ml-1">
            <BuildingStorefrontIcon className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase text-primary/80">Origen (Bodega)</h3>
          </div>
          <Controller
            name="almacen"
            control={control}
            render={({ field }) => (
              <Autocomplete
                defaultItems={bodegas as any[]}
                placeholder="Selecciona bodega origen"
                onSelectionChange={(val) => field.onChange(val ? String(val) : "")}
                selectedKey={field.value || null}
                variant="flat"
                color="primary"
                size="md"
              >
                {(item: any) => (
                  <AutocompleteItem key={item._id} textValue={item.name}>
                    {item.name}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}
          />
        </div>

        <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm transition-all group">
          <div className="flex items-center gap-2 mb-3 ml-1">
            <TruckIcon className="size-4 text-primary" />
            <h3 className="text-xs font-bold uppercase text-primary/80">Destino (Vendedor / Ruta)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Controller
              name="responsable"
              control={control}
              render={({ field }) => (
                <Input
                  label="Vendedor"
                  placeholder="Nombre del responsable"
                  variant="flat"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  isDisabled={!canAssignResponsible}
                  isInvalid={!!errors.responsable}
                  errorMessage={errors.responsable?.message?.toString()}
                />
              )}
            />
            <Controller
              name="ruta"
              control={control}
              render={({ field }) => (
                <Input
                  label="Ruta"
                  placeholder="Ruta asignada"
                  variant="flat"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Controller
            name="numeroCarga"
            control={control}
            render={({ field }) => (
              <Input
                label="No. salida"
                variant="flat"
                value={field.value || ""}
                onValueChange={field.onChange}
                isReadOnly={!isSuperAdmin}
                isDisabled={!isSuperAdmin}
                description={!isEdit ? "Se genera al guardar" : undefined}
                isInvalid={!!errors.numeroCarga}
                errorMessage={errors.numeroCarga?.message?.toString()}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                variant="flat"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
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
                variant="flat"
                value={field.value || ""}
                onValueChange={field.onChange}
                isInvalid={!!errors.fecha}
                errorMessage={errors.fecha?.message?.toString()}
              />
            )}
          />
          <Controller
            name="tipoEntrega"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo"
                variant="flat"
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
              >
                <SelectItem key="sucursal">Sucursal</SelectItem>
                <SelectItem key="pedido">Pedido</SelectItem>
              </Select>
            )}
          />
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
                        <span className={`font-bold ${index === activeIndex ? "text-white" : "text-primary"}`}>
                          ${Number(prod.lista1 || 0).toFixed(2)}
                        </span>
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

        <div className="overflow-hidden rounded-xl border border-default-100">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-default-100 bg-default-50 text-default-500">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                <th className="px-4 py-3 text-right font-semibold">Precio</th>
                <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                <th className="px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {formItems.map((prod: any, idx: number) => (
                <tr key={`${prod.productId || prod.id}-${idx}`} className="hover:bg-default-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{prod.sku}</td>
                  <td className="px-4 py-3 font-medium">{prod.descripcion}</td>
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
                  <td className="px-4 py-3 text-right font-mono">${Number(prod.precio || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    ${(Number(prod.precio || 0) * Number(prod.cantidad || 0)).toFixed(2)}
                  </td>
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
                  <td colSpan={6} className="px-4 py-10 text-center text-default-400 italic">
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
