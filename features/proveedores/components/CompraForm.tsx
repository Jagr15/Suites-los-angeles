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
    Card,
    CardBody,
    Divider,
} from "@heroui/react";
import {
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    TruckIcon,
    BuildingStorefrontIcon
} from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CompraRow, CompraProducto } from "@/shared/mocks/compras";



type CompraFormInternalValues = {
    folio: string;
    proveedor: string;
    almacen: string;
    fecha: string;
    recepcion: string;
    revision: string;
    status: string;
    monto: string;
    nota: string;
    productos: CompraProducto[];
};

type ProductOption = {
    id: string;
    sku: string;
    descripcion: string;
    categoria: string;
    subcategoria: string;
    stock: number;
    precio: number;
};

const defaultValues: CompraFormInternalValues = {
    folio: "",
    proveedor: "",
    almacen: "",
    fecha: new Date().toISOString().split("T")[0],
    recepcion: "Completa",
    revision: "Revisar",
    status: "Pendiente",
    monto: "0.00",
    nota: "",
    productos: [],
};

type CompraFormProps = {
    compra?: CompraRow | null;
    onSubmit: (data: CompraRow, editId?: string) => void;
    canEditPaymentStatus?: boolean;
    canEditReceptionStatus?: boolean;
    canEditDate?: boolean;
    onCancel: () => void;
};

export function CompraForm({
    compra,
    onSubmit,
    canEditPaymentStatus = false,
    canEditReceptionStatus = false,
    canEditDate = false,
    onCancel,
}: CompraFormProps) {
    const isEdit = !!compra;
    const convexSuppliers = useQuery(api.suppliers.queries.list) || [];
    const convexBodegas = useQuery(api.bodegas.queries.list) || [];
    const convexProductsList = useQuery(api.products.queries.list) || [];
    
    const suppliers = useMemo(() => {
        return convexSuppliers.map(s => ({
            id: s._id as string,
            proveedor: s.businessName,
            status: "Activo", // Mock status for now
            rfc: s.rfc
        }));
    }, [convexSuppliers]);

    const bodegas = useMemo(() => {
        return convexBodegas.map(b => ({
            id: b._id as string,
            name: b.name
        }));
    }, [convexBodegas]);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CompraFormInternalValues>({
        defaultValues: compra ? { ...compra } : defaultValues,
    });

    const productos = useWatch({ control, name: "productos" }) || [];
    const montoTotal = useMemo(() => {
        const total = productos.reduce((acc: number, p: CompraProducto) => acc + (p.total || 0), 0);
        return total.toLocaleString("en-US", { minimumFractionDigits: 2 });
    }, [productos]);

    useEffect(() => {
        if (compra) {
            reset({ ...compra });
        } else {
            reset({
                ...defaultValues,
                folio: "Se genera al guardar",
                fecha: new Date().toISOString().split("T")[0],
            });
        }
    }, [compra, reset]);

    const [productInput, setProductInput] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
    const [addQty, setAddQty] = useState("100");
    const [addCost, setAddCost] = useState("0");

    const productInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);
    const costInputRef = useRef<HTMLInputElement>(null);

    const products = useMemo<ProductOption[]>(() => {
        return convexProductsList.map((raw) => {
            const p = raw as Record<string, unknown>;
            const priceRaw = typeof p.lista1 === "string" ? p.lista1 : String(p.lista1 ?? "0");
            return {
                id: String(p._id ?? ""),
                sku: String(p.sku ?? ""),
                descripcion: String(p.producto ?? ""),
                categoria: String(p.categoria ?? ""),
                subcategoria: String(p.subcategoria ?? ""),
                stock: 0, // Stock pending implementation
                precio: parseFloat(priceRaw.replace(/[$,]/g, "")),
            };
        });
    }, [convexProductsList]);

    const filteredProducts = useMemo(() => {
        if (!productInput) return [];
        return products.filter(p =>
            `${p.descripcion} ${p.sku}`.toLowerCase().includes(productInput.toLowerCase())
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
                setProductInput(p.descripcion);
                setAddCost(p.precio.toString());
                setShowResults(false);
                setTimeout(() => qtyInputRef.current?.focus(), 50);
            }
        }
    };


    const handleAddProduct = () => {
        if (!selectedProduct) return;
        const qty = parseFloat(addQty) || 0;
        const cost = parseFloat(addCost) || selectedProduct.precio;

        const newProduct: CompraProducto = {
            id: selectedProduct.id,
            sku: selectedProduct.sku,
            descripcion: selectedProduct.descripcion,
            categoria: selectedProduct.categoria,
            subcategoria: selectedProduct.subcategoria,
            cantidad: qty,
            costo: cost,
            total: qty * cost,
            stockAnterior: selectedProduct.stock,
            stockNuevo: selectedProduct.stock + qty,
        };

        setValue("productos", [...productos, newProduct]);
        setSelectedProduct(null);
        setProductInput("");
        setAddQty("");
        setAddCost("");
        setTimeout(() => {
            productInputRef.current?.focus();
        }, 50);
    };

    const onFormSubmit = (data: CompraFormInternalValues) => {
        const row: CompraRow = {
            id: compra?.id ?? "",
            proveedorId: data.proveedor,
            ...data,
            monto: montoTotal,
            recepcion: data.recepcion as "Completa" | "Faltante",
            revision: data.revision as "Confirmada" | "Revisar",
        };
        onSubmit(row, compra?.id);
    };

    return (
        <div className="mx-auto w-full space-y-4 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-3 rounded-xl border border-default-200 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button isIconOnly variant="flat" onPress={onCancel} className="rounded-full overflow-hidden">
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    <div>
                        <h2 className="text-base font-semibold text-default-800 leading-none">
                            {isEdit ? "Editar Compra" : "Registro de Compra"}
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
                                {montoTotal}
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

            {/* Main Selectors Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Selector de Proveedor */}
                <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm transition-all group">
                    <div className="flex items-center gap-2 mb-3 ml-1">
                        <TruckIcon className="size-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase text-primary/80">Proveedor</h3>
                    </div>
                    <Controller
                        name="proveedor"
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
                                    <AutocompleteItem 
                                        key={item.id} 
                                        textValue={item.proveedor}
                                        className="rounded-xl"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-default-800">{item.proveedor}</span>
                                            <span className="text-[10px] text-default-400">RFC: {item.rfc}</span>
                                        </div>
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        )}
                    />
                </div>

                {/* Selector de Almacén */}
                <div className="bg-white p-3 rounded-xl border border-default-200 shadow-sm transition-all group">
                    <div className="flex items-center gap-2 mb-3 ml-1">
                        <BuildingStorefrontIcon className="size-4 text-secondary" />
                        <h3 className="text-xs font-bold uppercase text-secondary/80">Almacén Destino</h3>
                    </div>
                    <Controller
                        name="almacen"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
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
                                {bodegas.map((bod) => (
                                    <AutocompleteItem 
                                        key={bod.id} 
                                        textValue={bod.name}
                                        className="rounded-xl"
                                    >
                                        <span className="font-bold text-sm text-default-800">{bod.name}</span>
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                        )}
                    />
                </div>
            </div>

            {/* Document Metadata Area */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-default-200 shadow-sm">
                <div className="flex flex-col flex-1 min-w-[200px]">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">No. Folio / Factura</span>
                    <Controller
                        name="folio"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                size="sm"
                                variant="bordered"
                                placeholder="Automático"
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
                                <SelectItem key="Pendiente">Pendiente</SelectItem>
                                <SelectItem key="Pagado">Pagado</SelectItem>
                                <SelectItem key="Cancelado">Cancelado</SelectItem>
                            </Select>
                        )}
                    />
                </div>

                <div className="flex flex-col w-40">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">Estado Entrega</span>
                    <Controller
                        name="recepcion"
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
                                <SelectItem key="Completa">Completa</SelectItem>
                                <SelectItem key="Faltante">Faltante</SelectItem>
                                <SelectItem key="Pendiente">Pendiente</SelectItem>
                            </Select>
                        )}
                    />
                </div>

                <div className="flex flex-col w-44">
                    <span className="text-[10px] uppercase font-bold text-default-400 ml-1 mb-1.5">Fecha del Documento</span>
                    <Controller
                        name="fecha"
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

            {/* Product Entry Area */}
            <div className="flex items-center gap-2 w-full">
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
                            inputWrapper: "h-10 px-4 rounded-lg bg-white border border-default-200 shadow-sm",
                            input: "text-sm font-semibold"
                        }}
                        endContent={<MagnifyingGlassIcon className="size-6 text-default-300" />}
                    />
                    {showResults && productInput && filteredProducts.length > 0 && (
                        <div className="absolute z-50 mt-2 w-full p-2 bg-white rounded-3xl border border-default-200 shadow-xl max-h-60 overflow-y-auto">
                            {filteredProducts.map((p, index) => (
                                <button
                                    key={p.id}
                                    className={`flex w-full items-center justify-between p-4 rounded-2xl transition-colors text-left ${
                                        index === activeIndex ? "bg-primary-50 border-primary/20 border" : "hover:bg-default-50"
                                    }`}
                                    onClick={() => {
                                        setSelectedProduct(p);
                                        setProductInput(p.descripcion);
                                        setAddCost(p.precio.toString());
                                        setShowResults(false);
                                        setTimeout(() => qtyInputRef.current?.focus(), 50);
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div>
                                        <p className="font-semibold text-base">{p.descripcion}</p>
                                        <p className="text-xs text-default-400 font-mono italic">SKU: {p.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary text-base">${p.precio}</p>
                                        <p className="text-xs text-default-400 italic">Stock: {p.stock}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center h-10 px-4 rounded-lg border border-default-200 bg-white">
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

                <div className="flex items-center justify-center h-10 px-3 rounded-lg border border-default-200 bg-white gap-2">
                    <span className="text-base font-bold text-default-400">$</span>
                    <input
                        ref={costInputRef}
                        type="number"
                        className="w-20 text-base font-bold outline-none bg-transparent"
                        value={addCost}
                        onChange={(e) => setAddCost(e.target.value)}
                        placeholder="Precio"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddProduct();
                            }
                        }}
                    />
                </div>

                <div className="flex items-center justify-center h-10 px-4 rounded-lg border border-default-300 bg-default-50">
                    <span className="text-base font-bold text-default-500 italic">
                        {selectedProduct?.stock || "100"}
                    </span>
                </div>

                <Button isIconOnly className="size-10 rounded-lg bg-white border border-default-200 shadow-sm min-w-0" variant="bordered">
                    <FunnelIcon className="size-5 text-default-600" />
                </Button>

                <Button
                    isIconOnly
                    onPress={handleAddProduct}
                    className="size-10 rounded-lg bg-primary shadow-sm min-w-0"
                >
                    <PlusIcon className="size-5 text-white" />
                </Button>
            </div>

            {/* Table Area with HeroUI Table */}
            <div className="bg-white rounded-xl border border-default-200 shadow-sm overflow-hidden min-h-[520px]">
                <Table
                    aria-label="Tabla de productos de compra"
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
                    <TableBody items={productos} emptyContent={<div className="p-16 text-center text-default-300 italic font-semibold text-lg uppercase tracking-widest">Sin productos registrados</div>}>
                        {(p: CompraProducto) => (
                            <TableRow key={`${p.id}-${p.sku}`} className="border-b border-default-100 last:border-0 hover:bg-default-50/50 transition-colors">
                                <TableCell className="text-xs font-semibold text-default-600">{p.id}</TableCell>
                                <TableCell className="text-xs font-bold text-default-800">{p.sku}</TableCell>
                                <TableCell className="text-sm font-bold text-default-900 text-center">{p.cantidad}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-default-700">{p.descripcion}</span>
                                        <span className="text-[10px] text-default-400 italic">{p.subcategoria}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-default-500">{p.categoria}</TableCell>
                                <TableCell className="text-right text-sm font-semibold text-default-800">${p.costo.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-primary text-base">${p.total.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-default-400 italic">{p.stockAnterior}</TableCell>
                                <TableCell className="text-center font-bold text-default-800 italic underline decoration-1 underline-offset-4">{p.stockNuevo}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => setValue("productos", productos.filter((it) => it.id !== p.id))}
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
                name="nota"
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
