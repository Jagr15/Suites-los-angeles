"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Input,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
    cargaBodegaSchema,
    type CargaBodegaFormValues,
    type BodegaTipoEntrega,
    BODEGA_TIPO_ENTREGA_OPTIONS,
    getBodegaStatusOptionsByTipo,
} from "@/shared/schemas";
import type { BodegaRow, SalidaRow } from "@/shared/mocks";


const CONDUCTORES_MOCK = [
    { codigo: "C001", nombre: "Juan Pérez" },
    { codigo: "C002", nombre: "María López" },
    { codigo: "C003", nombre: "Carlos Ruiz" },
    { codigo: "C004", nombre: "Ana García" },
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
    tipoEntrega: "sucursal",
    productos: [],
};

function bodegaToFormValues(p: any): CargaBodegaFormValues {
    return {
        numeroCarga: p.numeroSalida || p.numeroCarga || "",
        fecha: p.fecha,
        status: p.status,
        responsable: p.responsable,
        tipoEntrega: p.tipoEntrega ?? "sucursal",
        productos: (p.productos || []).map((prod: any) => ({
            ...prod,
            sinStock: prod.sinStock ?? (prod.stock === 0)
        })),
        serie: p.serie,
        clienteCodigo: p.clienteCodigo,
        clienteNombre: p.clienteNombre,
        numeroDocumento: p.numeroDocumento,
        ruta: p.ruta,
        destino: p.destino,
    };
}

function toSalidaRow(data: CargaBodegaFormValues, id: string): any {
    return {
        ...data,
        id,
        numeroSalida: data.numeroCarga,
        lugarRuta: "Bodega",
        valor: (data.productos || []).reduce((acc, p) => acc + (p.precio || 0) * (p.cantidad || 0), 0),
        tipo: data.tipoEntrega === "pedido" ? "venta" : "carga",
    };
}

type BodegaSalidaFormProps = {
    salida?: SalidaRow | any | null;
    onSubmit: (data: any, editId?: string) => void;
    onCancel: () => void;
    canAssignResponsible?: boolean;
};

export function BodegaSalidaForm({ salida, onSubmit, onCancel, canAssignResponsible = true }: BodegaSalidaFormProps) {
    const products = useQuery(api.products.queries.list) || [];
    const isEdit = !!salida;
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

    const formItems = watch("productos") || [];

    const tipoEntrega = useWatch({
        control,
        name: "tipoEntrega",
        defaultValue: "sucursal",
    });

    const statusOptions = useMemo(() => {
        return getBodegaStatusOptionsByTipo(tipoEntrega);
    }, [tipoEntrega]);

    useEffect(() => {
        const currentStatus = control._formValues.status;
        if (statusOptions.length > 0 && !statusOptions.includes(currentStatus)) {
            setValue("status", statusOptions[0]);
        }
    }, [tipoEntrega, statusOptions, setValue, control]);

    const [productoSearch, setProductoSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [addQty, setAddQty] = useState("");
    const [showResults, setShowResults] = useState(false);

    const productInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    const productosFiltrados = useMemo(
        () =>
            (products as any[]).filter((p) =>
                `${p._id} ${p.sku} ${p.producto}`.toLowerCase().includes(productoSearch.toLowerCase())
            ),
        [productoSearch, products]
    );

    useEffect(() => {
        if (productosFiltrados.length > 0) {
            setActiveIndex(0);
        } else {
            setActiveIndex(-1);
        }
    }, [productosFiltrados]);

    const handleSelectProduct = (prod: any) => {
        setSelectedProduct(prod);
        setProductoSearch(prod.producto);
        setShowResults(false);
        setTimeout(() => {
            qtyInputRef.current?.focus();
        }, 50);
    };

    const handleAddProduct = () => {
        if (!selectedProduct) return;
        const qty = parseInt(addQty) || 1;
        const currentProducts = formItems;
        const exists = currentProducts.find((p: any) => p.productId === selectedProduct._id || p.id === selectedProduct._id);
        
        if (exists) {
            setValue("productos", currentProducts.map((p: any) =>
                (p.productId === selectedProduct._id || p.id === selectedProduct._id) ? { ...p, cantidad: (p.cantidad || 1) + qty } : p
            ));
        } else {
            setValue("productos", [...currentProducts, {
                productId: selectedProduct._id,
                id: selectedProduct._id,
                sku: selectedProduct.sku,
                descripcion: selectedProduct.producto,
                stock: selectedProduct.stock || 0,
                precio: selectedProduct.precio || 0,
                cantidad: qty,
                sinStock: (selectedProduct.stock || 0) === 0
            }]);
        }
        
        setProductoSearch("");
        setSelectedProduct(null);
        setAddQty("");
        setTimeout(() => {
            productInputRef.current?.focus();
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (productosFiltrados.length === 0) {
            if (e.key === "Enter" && selectedProduct) {
                e.preventDefault();
                handleAddProduct();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setShowResults(true);
            setActiveIndex(prev => (prev < productosFiltrados.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setShowResults(true);
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter") {
            if (showResults && activeIndex >= 0 && activeIndex < productosFiltrados.length) {
                e.preventDefault();
                handleSelectProduct(productosFiltrados[activeIndex]);
            }
        }
    };

    useEffect(() => {
        reset(salida ? bodegaToFormValues(salida) : defaultValues);
    }, [salida, reset]);

    useEffect(() => {
        if (!canAssignResponsible) {
            setValue("responsable", "Sin asignar");
        }
    }, [canAssignResponsible, setValue]);

    const onFormSubmit = (data: any) => {
        const row = {
            ...toSalidaRow(data as CargaBodegaFormValues, salida?._id ?? salida?.id ?? ""),
            productos: formItems, // Aseguramos que los productos se incluyan
        };
        onSubmit(row, salida?._id ?? salida?.id);
    };

    return (
        <div className="mx-auto w-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button isIconOnly variant="flat" onPress={onCancel}>
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? `Editando Salida: ${salida.numeroSalida || salida.numeroCarga}` : "Nueva Salida de Bodega"}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="flat" color="danger" onPress={onCancel}>
                        Cancelar
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => handleSubmit(onFormSubmit)()}
                        startContent={isEdit ? <PencilSquareIcon className="size-5" /> : <PlusIcon className="size-5" />}
                    >
                        {isEdit ? "Guardar Cambios" : "Crear Salida"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Información General */}
                <Card className="shadow-sm lg:col-span-1 border-none bg-content1">
                    <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                        <h3 className="text-lg font-bold">Datos de la Salida</h3>
                        <p className="text-xs text-default-500">Configuración logística y responsable</p>
                    </CardHeader>
                    <CardBody className="space-y-4 px-6 pb-6 mt-4">
                        <Controller
                            name="numeroCarga"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    label="Código de Salida"
                                    placeholder="Ej. SAL-1001"
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
                                    placeholder="Seleccionar..."
                                    defaultItems={CONDUCTORES_MOCK}
                                    selectedKey={field.value}
                                    onSelectionChange={(key) => field.onChange(key?.toString() || "")}
                                    isInvalid={!!errors.responsable}
                                    isDisabled={!canAssignResponsible}
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
                    </CardBody>
                </Card>

                {/* Productos */}
                <Card className="shadow-sm lg:col-span-2 border-none bg-content1">
                    <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                        <h3 className="text-lg font-bold">Productos en la salida</h3>
                        <p className="text-xs text-default-500">Agrega y gestiona los artículos de esta salida</p>
                    </CardHeader>
                    <CardBody className="space-y-6 px-6 pb-6 mt-4">
                        <div className="flex gap-4 items-end">
                            <div className="relative flex-1">
                                <Input
                                    ref={productInputRef}
                                    label="Buscar producto"
                                    placeholder="Nombre, SKU o ID..."
                                    value={productoSearch}
                                    onValueChange={(val) => {
                                        setProductoSearch(val);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    onKeyDown={handleKeyDown}
                                    startContent={<PlusIcon className="size-4 text-default-400" />}
                                />
                                {showResults && productoSearch && (
                                    <div className="absolute z-50 mt-1 max-h-[400px] w-full overflow-y-auto rounded-xl border border-default-200 bg-content1 p-1 shadow-xl">
                                        {productosFiltrados.map((prod, index) => (
                                            <button
                                                key={prod.id}
                                                type="button"
                                                onClick={() => handleSelectProduct(prod)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                className={`group flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left transition-all ${
                                                    index === activeIndex ? "bg-primary text-white shadow-md" : "hover:bg-default-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <span className="font-bold text-sm truncate max-w-[200px] lg:max-w-md">{prod.descripcion}</span>
                                                    <div className="flex items-center gap-4 text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                                                            index === activeIndex ? "bg-white/20" : 
                                                            prod.stock === 0 ? "bg-danger-50 text-danger" : "bg-success-50 text-success"
                                                        }`}>
                                                            Stock: {prod.stock}
                                                        </span>
                                                        <span className={`font-bold ${index === activeIndex ? "text-white/90" : "text-primary"}`}>
                                                            ${prod.precio.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <PlusIcon className={`size-5 ${index === activeIndex ? "text-white" : "text-primary"}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-32">
                                <Input
                                    ref={qtyInputRef}
                                    label="Cant."
                                    placeholder="1"
                                    type="number"
                                    value={addQty}
                                    onValueChange={setAddQty}
                                    onFocus={(e) => e.target.select()}
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

                        <Divider />

                        <Controller
                            name="productos"
                            control={control}
                            render={({ field }) => {
                                const prodsConStock = field.value.filter((p: any) => !p.sinStock);
                                const prodsSinStock = field.value.filter((p: any) => p.sinStock);

                                const renderTable = (items: any[], title: string, emptyMsg: string, isDanger?: boolean) => (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`text-sm font-bold uppercase tracking-wider ${isDanger ? "text-danger" : "text-primary"}`}>
                                                {title}
                                            </h4>
                                            <Chip size="sm" variant="flat" color={isDanger ? "danger" : "primary"}>
                                                {items.length} items
                                            </Chip>
                                        </div>
                                        <div className="overflow-hidden rounded-xl border border-default-100">
                                            <table className="w-full text-left text-sm text-foreground">
                                                <thead className="border-b border-default-100 bg-default-50 text-default-500">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">SKU / ID</th>
                                                        <th className="px-4 py-3 font-semibold">Descripción</th>
                                                        {!isDanger && <th className="px-4 py-3 text-right font-semibold">Total</th>}
                                                        <th className="px-4 py-3 text-right font-semibold"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-default-100">
                                                    {items.map((prod: any) => {
                                                        const globalIdx = field.value.findIndex((p: any) => p.id === prod.id);
                                                        return (
                                                            <tr key={prod.id} className="hover:bg-default-50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-mono text-xs font-bold">{prod.sku}</span>
                                                                        <span className="text-[10px] text-default-400">ID: {prod.id}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium">{prod.descripcion}</td>
                                                                {!isDanger && (
                                                                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                                                                        ${((prod.precio || 0) * prod.cantidad).toFixed(2)}
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3 text-right">
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        color="danger"
                                                                        onPress={() => field.onChange(field.value.filter((p: any) => p.id !== prod.id))}
                                                                    >
                                                                        <TrashIcon className="size-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {items.length === 0 && (
                                                        <tr>
                                                            <td colSpan={isDanger ? 3 : 4} className="px-4 py-8 text-center text-default-300 italic">
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
                                    <div className="space-y-8">
                                        {renderTable(prodsConStock, "Artículos con Existencia", "No hay productos con stock agregados.")}
                                        {renderTable(prodsSinStock, "Artículos Faltantes (Sin Stock)", "No hay artículos sin stock marcados.", true)}
                                    </div>
                                );
                            }}
                        />
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
