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
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    BuildingStorefrontIcon,
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon,
    ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type InventoryAdjustmentItem = {
    rowId: string;
    productId: string;
    sku: string;
    name: string;
    category: string;
    previousStock: number;
    newStock: number;
    quantity: number;
    reason: string;
};

type BodegaInventoryFormValues = {
    bodegaId: string;
    date: string;
    notes: string;
    items: InventoryAdjustmentItem[];
};

const defaultValues: BodegaInventoryFormValues = {
    bodegaId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
};

type BodegaInventoryFormProps = {
    onSubmit: (data: BodegaInventoryFormValues) => void;
    onCancel: () => void;
};

export function BodegaInventoryForm({ onSubmit, onCancel }: BodegaInventoryFormProps) {
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
            };
        });
    }, [rawProducts]);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<BodegaInventoryFormValues>({
        defaultValues,
    });

    const selectedBodegaId = useWatch({ control, name: "bodegaId" });
    const formItems = useWatch({ control, name: "items" }) || [];

    const [productInput, setProductInput] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
    const [newStockInput, setNewStockInput] = useState("");
    const [reasonInput, setReasonInput] = useState("Ajuste físico");

    const productInputRef = useRef<HTMLInputElement>(null);
    const newStockInputRef = useRef<HTMLInputElement>(null);

    // Fetch stock for the selected product in the selected bodega
    const currentStockInBodega = useQuery(
        api.inventory.queries.getStock,
        selectedProduct && selectedBodegaId 
            ? { productId: selectedProduct._id as Id<"products">, bodegaId: selectedBodegaId as Id<"bodegas"> } 
            : "skip"
    );

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
                setShowResults(false);
                setTimeout(() => newStockInputRef.current?.focus(), 50);
            }
        }
    };

    const handleAddItem = () => {
        if (!selectedProduct || !selectedBodegaId) return;
        const newStock = parseFloat(newStockInput);
        if (isNaN(newStock)) return;

        const previousStock = currentStockInBodega || 0;
        const diff = newStock - previousStock;

        const newItem = {
            rowId: `${selectedProduct._id}-${Date.now()}`,
            productId: selectedProduct._id,
            sku: selectedProduct.sku,
            name: selectedProduct.producto,
            category: selectedProduct.categoria,
            previousStock,
            newStock,
            quantity: diff, // Difference
            reason: reasonInput,
        };

        setValue("items", [...formItems, newItem]);
        setSelectedProduct(null);
        setProductInput("");
        setNewStockInput("");
        setTimeout(() => {
            productInputRef.current?.focus();
        }, 50);
    };

    const onFormSubmit = (data: BodegaInventoryFormValues) => {
        onSubmit(data);
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
                                        label="Almacén a Ajustar"
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
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-default-400">Fecha de Ajuste</span>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="date"
                                        className="text-sm font-semibold bg-default-50 border border-default-200 rounded-lg px-2 py-1 outline-none focus:border-primary/50 transition-colors w-36"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto pl-6 border-l border-default-100">
                    <Button
                        color="primary"
                        size="md"
                        className="rounded-full font-bold px-6"
                        onPress={() => handleSubmit(onFormSubmit)()}
                        startContent={<ClipboardDocumentCheckIcon className="size-5" />}
                        isDisabled={!selectedBodegaId || formItems.length === 0}
                    >
                        Procesar Ajuste
                    </Button>
                </div>
            </div>

            {/* Product Entry Area */}
            <div className={`flex items-center gap-3 w-full transition-opacity ${!selectedBodegaId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="relative flex-1">
                    <Input
                        ref={productInputRef}
                        size="md"
                        placeholder="Buscar producto para ajustar..."
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
                                        setShowResults(false);
                                        setTimeout(() => newStockInputRef.current?.focus(), 50);
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    type="button"
                                >
                                    <div>
                                        <p className="font-semibold text-base">{p.producto}</p>
                                        <p className="text-xs text-default-400 font-mono italic">SKU: {p.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary text-base">{p.categoria}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center h-11 px-4 rounded-full border border-default-400 bg-default-50 w-32">
                    <span className="text-sm font-bold text-default-500">
                        {selectedProduct 
                            ? `${currentStockInBodega ?? "..."} actual` 
                            : "Stock Sist."}
                    </span>
                </div>

                <div className="flex items-center justify-center h-11 px-6 rounded-full border border-default-200 bg-white shadow-sm">
                    <input
                        ref={newStockInputRef}
                        type="number"
                        className="w-24 text-base font-bold text-center outline-none bg-transparent"
                        value={newStockInput}
                        onChange={(e) => setNewStockInput(e.target.value)}
                        placeholder="Stock Real"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItem();
                            }
                        }}
                    />
                </div>

                <div className="flex items-center justify-center h-11 px-4 rounded-full border border-default-200 bg-white">
                    <input
                        type="text"
                        className="w-40 text-sm font-semibold outline-none bg-transparent"
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                        placeholder="Motivo (ej: Merma)"
                    />
                </div>

                <Button
                    isIconOnly
                    onPress={handleAddItem}
                    className="size-11 rounded-full bg-primary shadow-lg shadow-primary/20 min-w-0"
                    isDisabled={!selectedProduct || !newStockInput}
                >
                    <PlusIcon className="size-5 text-white" />
                </Button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-3xl border border-default-100 shadow-sm overflow-hidden min-h-[400px]">
                <Table
                    aria-label="Tabla de ajustes"
                    shadow="none"
                    removeWrapper
                    className="bg-transparent"
                >
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">Producto</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">SKU</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-center">Stock Sist.</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-center">Stock Real</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400 text-center">Diferencia</TableColumn>
                        <TableColumn className="bg-default-50 text-[10px] uppercase font-bold text-default-400">Motivo</TableColumn>
                        <TableColumn className="bg-default-50 w-10 text-right">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody items={formItems} emptyContent={<div className="p-16 text-center text-default-300 italic font-semibold text-lg uppercase tracking-widest">Agregue productos para ajustar</div>}>
                        {(p: InventoryAdjustmentItem) => (
                            <TableRow key={p.rowId} className="border-b border-default-100 last:border-0 hover:bg-default-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-default-700">{p.name}</span>
                                        <span className="text-[10px] text-default-400">{p.category}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-default-800">{p.sku}</TableCell>
                                <TableCell className="text-sm font-bold text-default-500 text-center">{p.previousStock}</TableCell>
                                <TableCell className="text-sm font-black text-primary text-center">{p.newStock}</TableCell>
                                <TableCell className="text-center">
                                    <span className={`text-sm font-bold ${p.quantity > 0 ? "text-success" : p.quantity < 0 ? "text-danger" : "text-default-400"}`}>
                                        {p.quantity > 0 ? `+${p.quantity}` : p.quantity}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-default-600 italic">{p.reason}</TableCell>
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
                            <span className="text-base font-bold text-default-800 mr-2 shrink-0">Nota Global:</span>
                            <textarea
                                {...field}
                                placeholder="Notas adicionales sobre el ajuste..."
                                className="flex-1 text-sm font-semibold text-default-600 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none h-auto overflow-hidden"
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
