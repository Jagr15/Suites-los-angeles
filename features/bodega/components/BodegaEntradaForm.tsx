"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
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
        <div className="mx-auto w-full space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-default-100 shadow-sm">
                <div className="flex items-center gap-6 flex-1">
                    <Button isIconOnly variant="flat" onPress={onCancel} className="rounded-full">
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-full max-w-sm">
                            <Controller
                                name="supplierId"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        defaultItems={suppliers}
                                        placeholder="Seleccionar Proveedor..."
                                        className="w-full"
                                        onSelectionChange={(val) => field.onChange(val ? String(val) : "")}
                                        selectedKey={field.value || null}
                                        variant="flat"
                                        color="secondary"
                                        size="md"
                                        label="Origen (Proveedor)"
                                        labelPlacement="outside"
                                        startContent={<TruckIcon className="size-5 text-secondary" />}
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
                                        {(item) => (
                                            <AutocompleteItem key={item._id} textValue={item.businessName}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-default-800">{item.businessName}</span>
                                                    <span className="text-[10px] text-default-400 uppercase tracking-widest">{item.rfc}</span>
                                                </div>
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                )}
                            />
                        </div>

                        <div className="w-full max-w-sm">
                            <Controller
                                name="bodegaId"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        defaultItems={bodegas}
                                        placeholder="Seleccionar Almacén..."
                                        className="w-full"
                                        onSelectionChange={(val) => field.onChange(val ? String(val) : "")}
                                        selectedKey={field.value || null}
                                        variant="flat"
                                        color="primary"
                                        size="md"
                                        label="Destino (Almacén)"
                                        labelPlacement="outside"
                                        startContent={<BuildingStorefrontIcon className="size-5 text-primary" />}
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
                                          <AutocompleteItem key={item._id} textValue={item.name}>
                                            <span className="font-bold text-sm text-default-800">{item.name}</span>
                                          </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 ml-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-default-400">No. Entrada</span>
                            <Controller
                                name="folio"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="text"
                                        readOnly
                                        placeholder="Automático"
                                        className="text-sm font-semibold bg-default-50 border border-default-200 rounded-lg px-2 py-1 outline-none w-24 cursor-default"
                                    />
                                )}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-default-400">Estado</span>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        size="sm"
                                        variant="faded"
                                        isDisabled={!canEditPaymentStatus}
                                        className="w-28 text-sm font-semibold"
                                        classNames={{ trigger: "h-8 min-h-8 bg-default-50 border-default-200" }}
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
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-default-400">Recepción</span>
                            <Controller
                                name="receptionStatus"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        size="sm"
                                        variant="faded"
                                        isDisabled={!canEditReceptionStatus}
                                        className="w-32 text-sm font-semibold"
                                        classNames={{ trigger: "h-8 min-h-8 bg-default-50 border-default-200" }}
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
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-default-400">Fecha</span>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="date"
                                        disabled={!canEditDate}
                                        className="text-sm font-semibold bg-default-50 border border-default-200 rounded-lg px-2 py-1 outline-none focus:border-primary/50 transition-colors w-36"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto pl-6 border-l border-default-100">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center justify-center h-8 rounded-full border border-default-300 bg-white px-4 shadow-sm">
                            <span className="text-sm font-bold text-default-900 leading-none">
                                ${montoTotalFormatted}
                            </span>
                        </div>
                    </div>
                    <Button
                        color="primary"
                        size="md"
                        className="rounded-full font-bold px-6"
                        onPress={() => handleSubmit(onFormSubmit)()}
                    >
                        {isEdit ? "Guardar" : "Registrar"}
                    </Button>
                </div>
            </div>

            {/* Product Entry Area */}
            <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1">
                    <Input
                        ref={productInputRef}
                        size="md"
                        placeholder="Buscar producto..."
                        value={productInput}
                        onValueChange={(val) => {
                            setProductInput(val);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        onKeyDown={handleKeyDown}
                        classNames={{
                            inputWrapper: "h-11 px-6 rounded-full bg-white border border-default-200 shadow-sm",
                            input: "text-sm font-semibold"
                        }}
                        endContent={<MagnifyingGlassIcon className="size-6 text-default-300" />}
                    />
                    {showResults && productInput && filteredProducts.length > 0 && (
                        <div className="absolute z-50 mt-2 w-full p-2 bg-white rounded-3xl border border-default-200 shadow-xl max-h-60 overflow-y-auto">
                            {filteredProducts.map((p, index) => (
                                <button
                                    key={p._id}
                                    className={`flex w-full items-center justify-between p-4 rounded-2xl transition-colors text-left ${
                                        index === activeIndex ? "bg-primary-50 border-primary/20 border" : "hover:bg-default-50"
                                    }`}
                                    onClick={() => {
                                        setSelectedProduct(p);
                                        setProductInput(p.producto);
                                        setAddCost(p.lista1 || "0");
                                        setShowResults(false);
                                        setTimeout(() => qtyInputRef.current?.focus(), 50);
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    type="button"
                                >
                                    <div>
                                        <p className="font-semibold text-base">{p.producto}</p>
                                        <p className="text-xs text-default-400 font-mono italic">SKU: {p.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary text-base">${p.lista1 || "0.00"}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center h-11 px-6 rounded-full border border-default-200 bg-white">
                    <input
                        ref={qtyInputRef}
                        type="number"
                        className="w-16 text-base font-bold text-center outline-none bg-transparent"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        placeholder="Cant."
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                costInputRef.current?.focus();
                            }
                        }}
                    />
                </div>

                <div className="flex items-center justify-center h-11 px-4 rounded-full border border-default-200 bg-white gap-2">
                    <span className="text-base font-bold text-default-400">$</span>
                    <input
                        ref={costInputRef}
                        type="number"
                        className="w-20 text-base font-bold outline-none bg-transparent"
                        value={addCost}
                        onChange={(e) => setAddCost(e.target.value)}
                        placeholder="Costo"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddProduct();
                            }
                        }}
                    />
                </div>

                <div className="flex items-center justify-center h-11 px-6 rounded-full border border-default-400 bg-default-50">
                    <span className="text-base font-bold text-default-500 italic">
                        {selectedProduct 
                            ? `${productStockInBodega ?? "..."} pz` 
                            : "Stock"}
                    </span>
                </div>

                <Button isIconOnly className="size-11 rounded-full bg-white border border-default-100 shadow-sm min-w-0" variant="bordered">
                    <FunnelIcon className="size-5 text-default-600" />
                </Button>

                <Button
                    isIconOnly
                    onPress={handleAddProduct}
                    className="size-11 rounded-full bg-primary shadow-lg shadow-primary/20 min-w-0"
                >
                    <PlusIcon className="size-5 text-white" />
                </Button>
            </div>

            {/* Table Area with HeroUI Table */}
            <div className="bg-white rounded-3xl border border-default-100 shadow-sm overflow-hidden min-h-[400px]">
                <Table
                    aria-label="Tabla de entradas"
                    shadow="none"
                    removeWrapper
                    className="bg-transparent"
                >
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">Código</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">SKU</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-center">Cant.</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">Producto</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">Categoría</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-right">Costo</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-right">Total</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-center leading-none">
                            Stock <br /> <span className="text-[8px]">Anterior</span>
                        </TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 italic text-center leading-none">
                            Stock <br /> <span className="text-[8px]">Nuevo</span>
                        </TableColumn>
                        <TableColumn className="bg-default-50 w-10 text-right">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody items={formItems} emptyContent={<div className="p-16 text-center text-default-300 italic font-semibold text-lg uppercase tracking-widest">Sin productos agregados</div>}>
                        {(p: EntryItem) => (
                            <TableRow key={p.rowId} className="border-b border-default-100 last:border-0 hover:bg-default-50/50 transition-colors">
                                <TableCell className="text-xs font-semibold text-default-600">
                                    {typeof p.productId === 'string' ? p.productId.slice(-4) : 'N/A'}
                                </TableCell>
                                <TableCell className="text-xs font-bold text-default-800">{p.sku || '---'}</TableCell>
                                <TableCell className="text-sm font-bold text-default-900 text-center">{p.quantity}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-default-700">{p.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-default-500">{p.category}</TableCell>
                                <TableCell className="text-right text-sm font-semibold text-default-800">${p.unitCost.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-primary text-base">${p.totalCost.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-default-400 italic">{p.stockAnterior}</TableCell>
                                <TableCell className="text-center font-bold text-default-800 italic underline decoration-1 underline-offset-4">{p.stockNuevo}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => setValue("items", formItems.filter((it) => it.rowId !== p.rowId))}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Notes Area */}
            <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                    <div className="relative group">
                        <div className="flex items-center min-h-[50px] w-full p-5 rounded-3xl border border-default-200 bg-white transition-all group-focus-within:border-primary">
                            <span className="text-base font-bold text-default-800 mr-2 shrink-0">Nota:</span>
                            <textarea
                                {...field}
                                placeholder="Introduzca observaciones aquí..."
                                className="flex-1 text-sm font-semibold text-danger bg-transparent border-none outline-none focus:ring-0 p-0 resize-none h-auto overflow-hidden"
                                rows={1}
                                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                }}
                            />
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
