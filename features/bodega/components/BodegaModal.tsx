"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  cargaBodegaSchema,
  type CargaBodegaFormValues,
  type BodegaTipoEntrega,
  BODEGA_TIPO_ENTREGA_OPTIONS,
  getBodegaStatusOptionsByTipo,
} from "@/shared/schemas";
import type { BodegaRow } from "@/shared/mocks";

const TIPO_LABELS: Record<BodegaTipoEntrega, string> = {
  sucursal: "Entrega a sucursal",
  pedido: "Pedido (Envío lejano)",
};

const CONDUCTORES_MOCK = [
  { codigo: "C001", nombre: "Juan Pérez" },
  { codigo: "C002", nombre: "María López" },
  { codigo: "C003", nombre: "Carlos Ruiz" },
  { codigo: "C004", nombre: "Ana García" },
];

const AGENTES_MOCK = [
  { codigo: "A001", nombre: "Agente 01" },
  { codigo: "A002", nombre: "Agente 02" },
  { codigo: "A003", nombre: "Agente 03" },
];

const PRODUCTOS_MOCK = [
  { id: "101", sku: "SKU-101", descripcion: "Aceite comestible 1L", stock: 50, precio: 25.5 },
  { id: "102", sku: "SKU-102", descripcion: "Azúcar estándar 1kg", stock: 120, precio: 18.0 },
  { id: "103", sku: "SKU-103", descripcion: "Harina de trigo 1kg", stock: 0, precio: 15.2 },
  { id: "104", sku: "SKU-104", descripcion: "Arroz súper extra 1kg", stock: 200, precio: 22.0 },
  { id: "105", sku: "SKU-105", descripcion: "Leche entera 1L", stock: 0, precio: 19.5 },
  { id: "106", sku: "SKU-106", descripcion: "Refresco 600ml", stock: 300, precio: 12.0 },
  { id: "107", sku: "SKU-107", descripcion: "Jabón de barra 200g", stock: 150, precio: 8.5 },
  { id: "108", sku: "SKU-108", descripcion: "Pasta de dientes 100ml", stock: 80, precio: 35.0 },
  { id: "109", sku: "SKU-109", descripcion: "Frijol negro 1kg", stock: 250, precio: 28.0 },
  { id: "110", sku: "SKU-110", descripcion: "Sal de mesa 500g", stock: 0, precio: 7.0 },
];

const defaultValues: CargaBodegaFormValues = {
  numeroCarga: "",
  fecha: new Date().toISOString().split("T")[0],
  status: "Listo para surtir",
  responsable: "",
  clienteDireccion: "",
  agente: "",
  almacen: "",
  tipoEntrega: "sucursal",
  productos: [],
};

function bodegaToFormValues(p: BodegaRow): CargaBodegaFormValues {
  return {
    numeroCarga: p.numeroCarga,
    fecha: p.fecha,
    status: p.status,
    responsable: p.responsable,
    clienteDireccion: p.clienteDireccion,
    almacen: p.almacen,
    agente: p.agente,
    tipoEntrega: p.tipoEntrega ?? "sucursal",
    productos: (p.productos || []).map(prod => ({
      ...prod,
      sinStock: prod.sinStock ?? (prod.stock === 0)
    })),
    // Opcionales
    serie: p.serie,
    clienteCodigo: p.clienteCodigo,
    clienteNombre: p.clienteNombre,
    numeroDocumento: p.numeroDocumento,
    ruta: p.ruta,
    destino: p.destino,
  };
}

function toBodegaRow(data: CargaBodegaFormValues, id: string): BodegaRow {
  return {
    ...data,
    id,
    codigo: data.numeroCarga,
    serie: data.serie || "A",
    clienteCodigo: data.clienteCodigo || "",
    clienteNombre: data.clienteNombre || "",
    clienteDireccion: data.clienteDireccion || "",
    numeroDocumento: data.numeroDocumento || "",
    ruta: data.ruta || "",
    destino: data.destino || "",
    tipoEntrega: data.tipoEntrega || "sucursal",
    almacen: data.almacen || "",
    agente: data.agente || "",
    productos: (data.productos || []).map(p => ({
      ...p,
      sku: p.sku || "",
      descripcion: p.descripcion || "",
      stock: p.stock ?? 0,
      sinStock: p.sinStock ?? false,
      precio: p.precio ?? 0
    })),
  } as BodegaRow;
}

type BodegaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bodega?: BodegaRow | null;
  onSubmit?: (data: BodegaRow, editId?: string) => void;
};

export function BodegaModal({ isOpen, onClose, bodega, onSubmit }: BodegaModalProps) {
  const isEdit = !!bodega;
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(cargaBodegaSchema) as any,
    defaultValues,
  });

  const tipoEntrega = useWatch({
    control,
    name: "tipoEntrega",
    defaultValue: "sucursal",
  });

  const statusOptions = useMemo(() => {
    return getBodegaStatusOptionsByTipo(tipoEntrega);
  }, [tipoEntrega]);

  // Si cambiamos el tipo de entrega y el estado actual no existe en el nuevo tipo, lo reseteamos
  useEffect(() => {
    const currentStatus = control._formValues.status;
    if (statusOptions.length > 0 && !statusOptions.includes(currentStatus)) {
      setValue("status", statusOptions[0]);
    }
  }, [tipoEntrega, statusOptions, setValue, control]);

  // No longer using statusOptions based on tipoEntrega for now based on new requirements

  const [conductorSearch, setConductorSearch] = useState("");
  const [conductorSeleccionado, setConductorSeleccionado] = useState<string | null>(null);
  const conductoresFiltrados = useMemo(
    () =>
      CONDUCTORES_MOCK.filter((c) =>
        `${c.codigo} ${c.nombre}`.toLowerCase().includes(conductorSearch.toLowerCase())
      ),
    [conductorSearch]
  );

  const [productoSearch, setProductoSearch] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const productosFiltrados = useMemo(
    () =>
      PRODUCTOS_MOCK.filter((p) =>
        `${p.id} ${p.sku} ${p.descripcion}`.toLowerCase().includes(productoSearch.toLowerCase())
      ),
    [productoSearch]
  );

  useEffect(() => {
    if (!isOpen) return;
    reset(bodega ? bodegaToFormValues(bodega) : defaultValues);
  }, [isOpen, bodega, reset]);

  // Cleanup: removed old status options sync logic

  const onFormSubmit = (data: any) => {
    const row = toBodegaRow(data as CargaBodegaFormValues, bodega?.id ?? "");
    onSubmit?.(row, bodega?.id);
    reset(defaultValues);
    onClose();
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="3xl" scrollBehavior="inside">
      <ModalContent className="overflow-hidden">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
          <ModalHeader className="shrink-0">
            {isEdit ? "Editar carga" : "Nueva carga"}
          </ModalHeader>
          <ModalBody className="max-h-[70vh] shrink overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="tipoEntrega"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Tipo de Entrega"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(s) => field.onChange(Array.from(s)[0])}
                    className="sm:col-span-2"
                  >
                    {BODEGA_TIPO_ENTREGA_OPTIONS.map((tipo) => (
                      <SelectItem key={tipo} textValue={TIPO_LABELS[tipo]}>
                        {TIPO_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name="numeroCarga"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Código de Carga"
                    placeholder="Ej. CG-1001"
                    value={field.value}
                    onValueChange={field.onChange}
                    isInvalid={!!errors.numeroCarga}
                    errorMessage={errors.numeroCarga?.message?.toString()}
                  />
                )}
              />
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Fecha"
                    type="date"
                    value={field.value}
                    onValueChange={field.onChange}
                    isInvalid={!!errors.fecha}
                    errorMessage={errors.fecha?.message?.toString()}
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
                    onSelectionChange={(s) => field.onChange(Array.from(s)[0])}
                  >
                    {statusOptions.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name="responsable"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label="Vendedor"
                    placeholder="Seleccionar vendedor..."
                    defaultItems={CONDUCTORES_MOCK}
                    selectedKey={field.value}
                    onSelectionChange={(key) => field.onChange(key?.toString() || "")}
                    isInvalid={!!errors.responsable}
                    errorMessage={errors.responsable?.message?.toString()}
                  >
                    {(item) => (
                      <AutocompleteItem key={item.nombre} textValue={item.nombre}>
                        {item.nombre} ({item.codigo})
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                )}
              />
              <Controller
                name="clienteDireccion"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Dirección"
                    placeholder="Calle, Número, Colonia"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="sm:col-span-2"
                  />
                )}
              />
              <Controller
                name="agente"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label="Agente"
                    placeholder="Seleccionar agente..."
                    defaultItems={AGENTES_MOCK}
                    selectedKey={field.value}
                    onSelectionChange={(key) => field.onChange(key?.toString() || "")}
                    isInvalid={!!errors.agente}
                    errorMessage={errors.agente?.message?.toString()}
                  >
                    {(item) => (
                      <AutocompleteItem key={item.nombre} textValue={item.nombre}>
                        {item.nombre} ({item.codigo})
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                )}
              />
              <Controller
                name="almacen"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Almacén"
                    placeholder="Ej. Almacén Central"
                    value={field.value}
                    onValueChange={field.onChange}
                    isInvalid={!!errors.almacen}
                    errorMessage={errors.almacen?.message?.toString()}
                  />
                )}
              />
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <p className="text-lg font-bold text-primary">Productos en la carga</p>
              </div>

              <div className="flex gap-2">
                <Input
                  label="Buscar producto para agregar"
                  placeholder="Escribe el nombre del producto..."
                  value={productoSearch}
                  onValueChange={setProductoSearch}
                  className="flex-1"
                />
              </div>

              {productoSearch && (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-default-200 bg-default-50/80 p-2 text-sm shadow-inner dark:border-default-100 dark:bg-default-50/10">
                  {productosFiltrados.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        const currentProducts = control._formValues.productos || [];
                        const exists = currentProducts.find((p: any) => p.id === prod.id);
                        if (exists) {
                          setValue("productos", currentProducts.map((p: any) =>
                            p.id === prod.id ? { ...p, cantidad: p.cantidad + 1 } : p
                          ));
                        } else {
                          setValue("productos", [...currentProducts, {
                            ...prod,
                            cantidad: 1,
                            sinStock: prod.stock === 0
                          }]);
                        }
                        setProductoSearch("");
                      }}
                      className="flex w-full items-center justify-between rounded px-3 py-2 text-left transition hover:bg-primary/20"
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-sm text-default-800">{prod.descripcion}</span>
                        <div className="flex items-center gap-3 text-xs text-default-500 mt-0.5">
                          <span className="bg-default-100 px-1 rounded font-mono">ID: {prod.id}</span>
                          <span>Stock: <span className={prod.stock === 0 ? "text-danger-500 font-bold" : "text-success-600 font-medium"}>{prod.stock}</span></span>
                          {prod.stock === 0 && <span className="bg-danger-100 text-danger-600 px-1 rounded font-bold">SIN STOCK</span>}
                          <span className="font-semibold text-primary">Tarifa: ${prod.precio.toFixed(2)}</span>
                        </div>
                      </div>
                      <PlusIcon className="size-5 text-primary" />
                    </button>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <p className="px-1 py-0.5 text-xs text-default-500">No se encontraron productos.</p>
                  )}
                </div>
              )}

              <Controller
                name="productos"
                control={control}
                render={({ field }) => {
                  const prodsConStock = field.value.filter((p: any) => !p.sinStock);
                  const prodsSinStock = field.value.filter((p: any) => p.sinStock);

                  const renderTable = (items: any[], title: string, emptyMsg: string, isDanger?: boolean) => (
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 border-b pb-1 ${isDanger ? "border-danger-200" : "border-default-200"}`}>
                        <p className={`text-sm font-bold ${isDanger ? "text-danger-600" : "text-default-700"}`}>{title}</p>
                        <span className="text-xs bg-default-100 px-2 rounded-full">{items.length}</span>
                      </div>
                      <div className="rounded-xl border border-default-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-default-100 text-default-600">
                            <tr>
                              <th className="px-4 py-2 font-semibold">Código</th>
                              <th className="px-4 py-2 font-semibold">Descripción</th>
                              <th className="px-4 py-2 font-semibold text-center">Cant.</th>
                              {!isDanger && <th className="px-4 py-2 font-semibold text-right">Precio</th>}
                              {!isDanger && <th className="px-4 py-2 font-semibold text-right">Total</th>}
                              <th className="px-4 py-2 font-semibold text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-default-100">
                            {items.map((prod: any) => {
                              const globalIdx = field.value.findIndex((p: any) => p.id === prod.id);
                              return (
                                <tr key={prod.id} className="hover:bg-default-50">
                                  <td className="px-4 py-2 font-mono text-xs">{prod.id}</td>
                                  <td className="px-4 py-2 text-xs font-medium">{prod.descripcion}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        className="size-5 rounded bg-default-200 flex items-center justify-center hover:bg-default-300 text-xs"
                                        onClick={() => {
                                          const newProds = [...field.value];
                                          if (newProds[globalIdx].cantidad > 1) {
                                            newProds[globalIdx].cantidad -= 1;
                                            field.onChange(newProds);
                                          }
                                        }}
                                      >
                                        -
                                      </button>
                                      <span className="w-6 text-center text-xs font-mono">{prod.cantidad}</span>
                                      <button
                                        type="button"
                                        className="size-5 rounded bg-default-200 flex items-center justify-center hover:bg-default-300 text-xs"
                                        onClick={() => {
                                          const newProds = [...field.value];
                                          newProds[globalIdx].cantidad += 1;
                                          field.onChange(newProds);
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  {!isDanger && <td className="px-4 py-2 text-right text-xs">${(prod.precio || 0).toFixed(2)}</td>}
                                  {!isDanger && <td className="px-4 py-2 text-right text-xs font-bold">${((prod.precio || 0) * prod.cantidad).toFixed(2)}</td>}
                                  <td className="px-4 py-2 text-right">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      onClick={() => field.onChange(field.value.filter((p: any) => p.id !== prod.id))}
                                    >
                                      <TrashIcon className="size-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                            {items.length === 0 && (
                              <tr>
                                <td colSpan={isDanger ? 4 : 6} className="px-4 py-4 text-center text-default-400 italic text-xs">
                                  {emptyMsg}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-6 mt-4">
                      {renderTable(prodsConStock, "PRODUCTOS CON STOCK", "No hay productos con stock agregados.")}
                      {renderTable(prodsSinStock, "ARTÍCULOS SIN STOCK", "No hay artículos sin stock marcados.", true)}
                    </div>
                  );
                }}
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
              startContent={
                isEdit ? (
                  <PencilSquareIcon className="size-5" />
                ) : (
                  <PlusIcon className="size-5" />
                )
              }
            >
              {isEdit ? "Guardar cambios" : "Nueva carga"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
