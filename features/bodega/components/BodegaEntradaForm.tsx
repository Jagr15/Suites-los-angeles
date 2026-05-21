"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
    Button,
    Input,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    TruckIcon,
    BuildingStorefrontIcon,
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Adaptado de CompraForm para usarse como Entrada en Bodega
import { type BodegaRow } from "@/shared/mocks";

type EntryItem = {
    rowId: string;
    productId: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    stockAnterior: number;
    stockNuevo: number;
};

type BodegaEntradaFormValues = {
    folio: string;
    supplierId: string;
    bodegaId: string;
    date: string;
    receptionStatus: string;
    status: string;
    totalAmount: number;
    notes: string;
    items: EntryItem[];
};

const defaultValues: BodegaEntradaFormValues = {
    folio: "",
    supplierId: "",
    bodegaId: "",
    date: new Date().toISOString().split("T")[0],
    receptionStatus: "Completa",
    status: "Pendiente",
    totalAmount: 0,
    notes: "",
    items: [],
};

// Función auxiliar para limpiar y parsear números con símbolos de moneda
const parseCurrency = (val: string | number) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const clean = val.replace(/[$,\s]/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
};

type BodegaEntradaFormProps = {
    entrada?: (BodegaRow & { _id?: string; receptionStatus?: string; recepcion?: string; items?: EntryItem[] }) | null;
    onSubmit: (data: BodegaEntradaFormValues, editId?: string) => void;
    canEditPaymentStatus?: boolean;
    canEditReceptionStatus?: boolean;
    canEditDate?: boolean;
    onCancel: () => void;
};

export function BodegaEntradaForm({
    entrada,
    onSubmit,
    canEditPaymentStatus = false,
    canEditReceptionStatus = false,
    canEditDate = false,
    onCancel,
}: BodegaEntradaFormProps) {
    const isEdit = !!entrada;
    
    // Convex Data
    const rawProducts = useQuery(api.products.queries.list) || [];
    const suppliers = useQuery(api.suppliers.queries.list) || [];
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
            };
        });
    }, [rawProducts]);
    
    const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
    const [productInput, setProductInput] = useState("");
    const [addQty, setAddQty] = useState("100");
    const [addCost, setAddCost] = useState("0");

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BodegaEntradaFormValues>({
        defaultValues: entrada ? { ...entrada } : defaultValues,
    });

    const selectedBodegaId = useWatch({ control, name: "bodegaId" });
    const productStockInBodega = useQuery(
        api.inventory.queries.getStock,
        selectedProduct && selectedBodegaId 
            ? { productId: selectedProduct._id as Id<"products">, bodegaId: selectedBodegaId as Id<"bodegas"> } 
            : "skip"
    );

    const formItems = watch("items") || [];
    const montoTotalValue = useMemo(() => {
        return formItems.reduce((acc: number, p) => acc + (p.totalCost || 0), 0);
    }, [formItems]);

    const montoTotalFormatted = useMemo(() => {
        return montoTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
    }, [montoTotalValue]);

    useEffect(() => {
        if (entrada) {
            const receptionStatus = entrada.receptionStatus || entrada.recepcion || "Completa";
            reset({ ...(entrada as unknown as BodegaEntradaFormValues), receptionStatus });
            
            // Forzamos el seteo de items por si el reset no lo dispara correctamente en el watch
            if (entrada.items) {
                setValue("items", entrada.items);
            }
        } else {
            reset({
                ...defaultValues,
                folio: "Se genera al guardar",
                date: new Date().toISOString().split("T")[0],
                items: [],
            });
        }
    }, [entrada, reset, setValue]);

    const productInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);
    const costInputRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        if (!productInput) return [];
        return products.filter(p =>
            `${p.producto} ${p.sku}`.toLowerCase().includes(productInput.toLowerCase())
        );
    }, [productInput, products]);

    const [activeIndex, setActiveIndex] = useState(-1);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            productInputRef.current?.focus();
        }, 100);
    }, []);

    useEffect(() => {
        if (filteredProducts.length > 0) {
            setActiveIndex(0);
        } else {
            setActiveIndex(-1);
        }
    }, [filteredProducts]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (filteredProducts.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < filteredProducts.length) {
                e.preventDefault();
                const p = filteredProducts[activeIndex];
                setSelectedProduct(p);
                setProductInput(p.producto);
                setAddCost(p.lista1 || "0");
                setShowResults(false);
                setTimeout(() => qtyInputRef.current?.focus(), 50);
            }
        }
    };

    const handleAddProduct = () => {
        if (!selectedProduct) return;
        const qty = parseCurrency(addQty);
        const cost = parseCurrency(addCost);

        const currentStock = productStockInBodega || 0;

        const newProduct = {
            rowId: `${selectedProduct._id}-${Date.now()}`,
            productId: selectedProduct._id,
            sku: selectedProduct.sku,
            name: selectedProduct.producto,
            category: selectedProduct.categoria,
            quantity: qty,
            unitCost: cost,
            totalCost: qty * cost,
            stockAnterior: currentStock,
            stockNuevo: currentStock + qty,
        };

        setValue("items", [...formItems, newProduct]);
        setSelectedProduct(null);
        setProductInput("");
        setAddQty("100");
        setAddCost("");
        setTimeout(() => {
            productInputRef.current?.focus();
        }, 50);
    };

    const onFormSubmit = (data: BodegaEntradaFormValues) => {
        const row = {
            ...data,
            totalAmount: montoTotalValue,
            items: formItems, // Aseguramos que los items actuales se incluyan
        };
        onSubmit(row, entrada?._id);
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
                            {isEdit ? "Editar Entrada" : "Registro de Entrada"}
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
                        <TruckIcon className="size-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase text-primary/80">Origen (Proveedor)</h3>
                    </div>
                    <Controller
                        name="supplierId"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                defaultItems={suppliers}
                                placeholder="Buscar proveedor..."
                                className="w-full"
                                onSelectionChange={(val) => field.onChange(val ? String(val) : "")}
                                selectedKey={field.value || null}
                                variant="flat"
                                color="primary"
                                size="md"
                                classNames={{
                                    base: "w-full",
                                    listbox: "rounded-2xl",
                                    popoverContent: "rounded-2xl shadow-xl",
                                }}
                                inputProps={{
                                    classNames: {
                                        inputWrapper: "rounded-lg bg-default-50 font-semibold min-h-10",
                                        input: "text-sm font-semibold",
                                    }
                                }}
                            >
                                {(item) => (
                                    <AutocompleteItem key={item._id} textValue={item.businessName} className="rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-default-800">{item.businessName}</span>
                                            <span className="text-[10px] text-default-400">RFC: {item.rfc}</span>
                                        </div>
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        )}
                    />
                </div>

                <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm transition-all group">
                    <div className="flex items-center gap-2 mb-3 ml-1">
                        <BuildingStorefrontIcon className="size-4 text-secondary" />
                        <h3 className="text-xs font-bold uppercase text-secondary/80">Almacén Destino</h3>
                    </div>
                    <Controller
                        name="bodegaId"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                defaultItems={bodegas}
                                placeholder="Seleccionar bodega..."
                                className="w-full"
                                onSelectionChange={(val) => field.onChange(val ? String(val) : "")}
                                selectedKey={field.value || null}
                                variant="flat"
                                color="secondary"
                                size="md"
                                classNames={{
                                    base: "w-full",
                                    listbox: "rounded-2xl",
                                    popoverContent: "rounded-2xl shadow-xl",
                                }}
                                inputProps={{
                                    classNames: {
                                        inputWrapper: "rounded-lg bg-default-50 font-semibold min-h-10",
                                        input: "text-sm font-semibold",
                                    }
                                }}
                            >
                                {(item) => (
                                    <AutocompleteItem key={item._id} textValue={item.name} className="rounded-xl">
                                        <span className="font-bold text-sm text-default-800">{item.name}</span>
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        )}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-default-200 shadow-sm">
                <div className="flex flex-col flex-1 min-w-[200px]">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">No. Folio / Entrada</span>
                    <Controller
                        name="folio"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                size="sm"
                                variant="bordered"
                                placeholder="Se genera al guardar"
                                isReadOnly
                                classNames={{
                                    inputWrapper: "h-10 rounded-xl border-default-200 bg-default-50/50",
                                    input: "font-bold"
                                }}
                            />
                        )}
                    />
                </div>

                <div className="flex flex-col w-36">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">Estado Pago</span>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                size="sm"
                                variant="bordered"
                                isDisabled={!canEditPaymentStatus}
                                classNames={{ trigger: "h-10 rounded-xl border-default-200 bg-default-50/50" }}
                                selectedKeys={field.value ? [field.value] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                            >
                                <SelectItem key="Pendiente" textValue="Pendiente">Pendiente</SelectItem>
                                <SelectItem key="Pagado" textValue="Pagado">Pagado</SelectItem>
                                <SelectItem key="Cancelado" textValue="Cancelado">Cancelado</SelectItem>
                            </Select>
                        )}
                    />
                </div>

                <div className="flex flex-col w-40">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">Estado Entrega</span>
                    <Controller
                        name="receptionStatus"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                size="sm"
                                variant="bordered"
                                isDisabled={!canEditReceptionStatus}
                                classNames={{ trigger: "h-10 rounded-xl border-default-200 bg-default-50/50" }}
                                selectedKeys={field.value ? [field.value] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                            >
                                <SelectItem key="Completa" textValue="Completa">Completa</SelectItem>
                                <SelectItem key="Faltante" textValue="Faltante">Faltante</SelectItem>
                                <SelectItem key="Pendiente" textValue="Pendiente">Pendiente</SelectItem>
                            </Select>
                        )}
                    />
                </div>

                <div className="flex flex-col w-44">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">Fecha del Documento</span>
                    <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center h-10 px-4 rounded-xl border-2 border-default-200 bg-default-50/50">
                                <input
                                    {...field}
                                    type="date"
                                    disabled={!canEditDate}
                                    className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                                />
                            </div>
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
                            endContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                        />
                        {showResults && productInput && filteredProducts.length > 0 && (
                            <div className="absolute z-50 mt-1 max-h-[320px] w-full overflow-y-auto rounded-xl border border-default-200 bg-content1 p-1 shadow-xl">
                                {filteredProducts.map((p, index) => (
                                    <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setProductInput(p.producto);
                                            setAddCost(p.lista1 || "0");
                                            setShowResults(false);
                                            setTimeout(() => qtyInputRef.current?.focus(), 50);
                                        }}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`group flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left transition-all ${
                                            index === activeIndex ? "bg-primary text-white shadow-md" : "hover:bg-default-100"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <span className="font-bold text-sm truncate max-w-[220px] lg:max-w-md">{p.producto}</span>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full font-bold ${index === activeIndex ? "bg-white/20" : "bg-default-100"}`}>
                                                    Stock: {selectedProduct?._id === p._id ? (productStockInBodega ?? "...") : "-"}
                                                </span>
                                                <span className={`font-bold ${index === activeIndex ? "text-white" : "text-primary"}`}>
                                                    ${Number(p.lista1 || 0).toFixed(2)}
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
                                    costInputRef.current?.focus();
                                }
                            }}
                        />
                    </div>

                    <div className="w-36">
                        <Input
                            ref={costInputRef}
                            label="Precio"
                            type="number"
                            min={0}
                            value={addCost}
                            onValueChange={setAddCost}
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
                            {formItems.map((p: EntryItem, idx: number) => (
                                <tr key={p.rowId} className="hover:bg-default-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs font-bold">{p.sku}</td>
                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Input
                                            type="number"
                                            size="sm"
                                            min={1}
                                            className="max-w-24 ml-auto"
                                            value={String(p.quantity || 1)}
                                            onValueChange={(value) => {
                                                const next = [...formItems];
                                                const quantity = Math.max(1, parseInt(value || "1", 10) || 1);
                                                next[idx] = {
                                                    ...next[idx],
                                                    quantity,
                                                    totalCost: quantity * Number(next[idx].unitCost || 0),
                                                    stockNuevo: Number(next[idx].stockAnterior || 0) + quantity,
                                                };
                                                setValue("items", next);
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">${Number(p.unitCost || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                                        ${(Number(p.unitCost || 0) * Number(p.quantity || 0)).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => setValue("items", formItems.filter((it) => it.rowId !== p.rowId))}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {formItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-default-400 italic">
                                        No hay productos agregados a la entrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Area */}
            <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                    <Input
                        label="Nota"
                        placeholder="Observaciones de entrada"
                        variant="flat"
                        value={field.value || ""}
                        onValueChange={field.onChange}
                    />
                )}
            />
        </div>
    );
}
