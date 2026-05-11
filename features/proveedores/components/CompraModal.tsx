"use client";

import { useEffect } from "react";
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
  Divider,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TruckIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { mockProveedores, ALMACENES_MOCK } from "@/shared/mocks";
import {
  compraSchema,
  type CompraFormValues,
  COMPRA_STATUS,
  COMPRA_RECEPCION,
  COMPRA_REVISION,
} from "@/shared/schemas";
import type { CompraRow } from "@/shared/mocks";

const defaultValues: CompraFormValues = {
  folio: "C-" + Math.floor(Math.random() * 9000 + 1000),
  proveedor: "",
  almacen: "Almacén Central",
  fecha: "",
  recepcion: "Completa",
  revision: "Revisar",
  status: "Pendiente",
  monto: "",
  productos: [],
};

function compraToFormValues(p: CompraRow): CompraFormValues {
  return {
    folio: p.folio,
    proveedor: p.proveedor,
    almacen: p.almacen || "Almacén Central",
    fecha: p.fecha,
    recepcion: p.recepcion,
    revision: p.revision,
    status: p.status as CompraFormValues["status"],
    monto: p.monto,
    productos: p.productos,
  };
}

function toCompraRow(data: CompraFormValues, id: string): CompraRow {
  return {
    id,
    proveedorId: "1", // Mock ID
    folio: data.folio,
    proveedor: data.proveedor,
    almacen: data.almacen,
    fecha: data.fecha,
    recepcion: data.recepcion,
    revision: data.revision,
    status: data.status,
    monto: data.monto,
    productos: data.productos,
  };
}

type CompraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  compra?: CompraRow | null;
  onSubmit?: (data: CompraRow, editId?: string) => void;
};

export function CompraModal({ isOpen, onClose, compra, onSubmit }: CompraModalProps) {
  const isEdit = !!compra;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (compra) {
      reset(compraToFormValues(compra));
    } else {
      reset({
        ...defaultValues,
        folio: `C-${Math.floor(Math.random() * 90000) + 10000}`,
        fecha: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen, compra, reset]);

  const onFormSubmit = (data: CompraFormValues) => {
    const row = toCompraRow(data, compra?.id ?? "");
    onSubmit?.(row, compra?.id);
    reset(defaultValues);
    onClose();
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="xl" scrollBehavior="inside" backdrop="blur">
      <ModalContent className="rounded-3xl">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
          <ModalHeader className="shrink-0 flex flex-col gap-1 p-6">
            <h2 className="text-xl font-bold text-default-800">
              {isEdit ? "Editar compra" : "Registrar compra"}
            </h2>
            <p className="text-sm text-default-400 font-normal">
              Ingrese los detalles de la compra realizada al proveedor.
            </p>
          </ModalHeader>
          <ModalBody className="p-0">
            {/* Redesigned Header Area matching BodegaEntradaForm */}
            <div className="flex flex-col bg-default-50/50 border-b border-default-100">
              <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-full max-w-[280px]">
                    <Controller
                      name="proveedor"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          defaultItems={mockProveedores}
                          placeholder="Seleccionar..."
                          className="w-full"
                          onSelectionChange={(val) => field.onChange(val)}
                          selectedKey={field.value}
                          variant="flat"
                          color="primary"
                          size="md"
                          label="Proveedor"
                          labelPlacement="outside"
                          startContent={<TruckIcon className="size-5 text-primary" />}
                          classNames={{
                            base: "max-w-md",
                            listbox: "rounded-2xl",
                            popoverContent: "rounded-2xl",
                            selectorButton: "text-primary"
                          }}
                          inputProps={{
                            classNames: {
                              inputWrapper: "h-11 px-4 rounded-xl bg-primary/10 border-none font-bold text-sm",
                              input: "placeholder:font-normal",
                              label: "text-[10px] font-bold uppercase text-primary mb-1 ml-1"
                            }
                          }}
                        >
                          {(item) => (
                            <AutocompleteItem key={item.proveedor} textValue={item.proveedor}>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-default-800">{item.proveedor}</span>
                                <span className="text-[10px] text-default-400 uppercase tracking-widest">{item.status}</span>
                              </div>
                            </AutocompleteItem>
                          )}
                        </Autocomplete>
                      )}
                    />
                  </div>

                  <div className="w-full max-w-[280px]">
                    <Controller
                      name="almacen"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          placeholder="Seleccionar..."
                          className="w-full"
                          onSelectionChange={(val) => field.onChange(val)}
                          selectedKey={field.value || "Almacén Central"}
                          variant="flat"
                          color="secondary"
                          size="md"
                          label="Almacén Destino"
                          labelPlacement="outside"
                          startContent={<BuildingStorefrontIcon className="size-5 text-secondary" />}
                          classNames={{
                            base: "max-w-md",
                            listbox: "rounded-2xl",
                            popoverContent: "rounded-2xl",
                            selectorButton: "text-secondary"
                          }}
                          inputProps={{
                            classNames: {
                              inputWrapper: "h-11 px-4 rounded-xl bg-secondary/10 border-none font-bold text-sm",
                              input: "placeholder:font-normal",
                              label: "text-[10px] font-bold uppercase text-secondary mb-1 ml-1"
                            }
                          }}
                        >
                          {ALMACENES_MOCK.map((alm) => (
                            <AutocompleteItem key={alm} textValue={alm}>
                              <span className="font-bold text-sm text-default-800">{alm}</span>
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase font-bold text-default-400">Total</span>
                  <div className="flex items-center justify-center h-8 rounded-full border border-primary/40 bg-white px-4 shadow-sm">
                    <span className="text-sm font-bold text-primary leading-none">
                      ${useWatch({ control, name: "monto" }) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 px-6 pb-6 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-default-400">No. Folio</span>
                    <Controller
                      name="folio"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          readOnly
                          className="text-sm font-semibold bg-white border border-default-200 rounded-lg px-2 py-1 outline-none w-24 cursor-default"
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-default-400">Fecha</span>
                    <Controller
                      name="fecha"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="date"
                          className="text-sm font-semibold bg-white border border-default-200 rounded-lg px-2 py-1 outline-none focus:border-primary/50 transition-colors w-36"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-default-400">Detalles de Operación</p>
                <div className="grid gap-4">
                  <Controller
                    name="recepcion"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Recepción"
                        placeholder="Seleccionar..."
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(s) => field.onChange(Array.from(s)[0])}
                        variant="bordered"
                        size="sm"
                      >
                        {COMPRA_RECEPCION.map((s) => (
                          <SelectItem key={s}>{s}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Controller
                    name="revision"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Revisión"
                        placeholder="Seleccionar..."
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(s) => field.onChange(Array.from(s)[0])}
                        variant="bordered"
                        size="sm"
                      >
                        {COMPRA_REVISION.map((s) => (
                          <SelectItem key={s}>{s}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-default-400">Finanzas y Pagos</p>
                <div className="grid gap-4">
                  <Controller
                    name="monto"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Monto Manual (si aplica)"
                        placeholder="0.00"
                        value={field.value}
                        onValueChange={field.onChange}
                        startContent={<span className="text-default-400 text-sm">$</span>}
                        variant="bordered"
                        size="sm"
                      />
                    )}
                  />
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Estado de Pago"
                        placeholder="Seleccionar..."
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(s) => field.onChange(Array.from(s)[0])}
                        variant="bordered"
                        size="sm"
                      >
                        {COMPRA_STATUS.map((s) => (
                          <SelectItem key={s}>{s}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="p-6 border-t border-default-100 flex gap-3">
            <Button type="button" variant="light" onPress={handleClose} className="rounded-full font-medium">
              Cancelar
            </Button>
            <Button
              color="primary"
              type="submit"
              className="rounded-full font-bold shadow-lg shadow-primary/20 flex-1"
              startContent={
                isEdit ? (
                  <PencilSquareIcon className="size-5" />
                ) : (
                  <PlusIcon className="size-5" />
                )
              }
            >
              {isEdit ? "Guardar cambios" : "Registrar compra"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
