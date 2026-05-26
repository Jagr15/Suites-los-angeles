"use client";

import { useState, useMemo, useEffect } from "react";
import { addToast } from "@heroui/react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Pagination,
    Button,
    Tooltip,
    Tabs,
    Tab,
    Input,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { SalidaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 8;

const FILTERS = [
    { key: "todos", label: "Todos", color: "default" as const },
    { key: "creado", label: "Creado", color: "danger" as const },
    { key: "surtido", label: "Surtido", color: "warning" as const, customColor: "bg-[#f97316]" },
    { key: "revisado", label: "Revisado", color: "warning" as const, customColor: "bg-[#eab308]" },
    { key: "empacado", label: "Empacado", color: "warning" as const, customColor: "bg-[#facc15]" },
    { key: "tarima", label: "En Tarima", color: "success" as const, customColor: "bg-[#a3e635]" },
    { key: "completado", label: "Completado", color: "success" as const },
    { key: "enviado", label: "Enviado", color: "default" as const, customColor: "bg-[#374151]" },
    { key: "entregado", label: "Entregado", color: "default" as const },
];

const STATUS_OPTIONS = FILTERS.filter(f => f.key !== "todos").map(f => f.label);

const columns = [
    { key: "numeroSalida", label: "No Salida" },
    { key: "responsable", label: "Responsable" },
    { key: "lugarRuta", label: "Lugar/Ruta" },
    { key: "fecha", label: "Fecha" },
    { key: "status", label: "Estado" },
    { key: "valor", label: "Productos / Total" },
    { key: "actions", label: "Acciones" },
];

function statusColor(status: string): "success" | "warning" | "danger" | "primary" | "default" {
    if (status === "Creado") return "danger";
    if (status === "Surtido" || status === "Revisado" || status === "Empacado") return "warning";
    if (status === "En Tarima" || status === "Completado") return "success";
    if (status === "Enviado" || status === "Entregado") return "default";
    return "default";
}

type BodegaSalidasProps = {
    items: SalidaRow[];
    onAgregar?: () => void;
    onEditar?: (item: SalidaRow) => void;
    onBorrar?: (item: SalidaRow) => void;
    onVer?: (item: SalidaRow) => void;
    canDelete?: boolean;
};

export function BodegaSalidas({ items: initialItems, onAgregar, onEditar, onBorrar, onVer, canDelete = true }: BodegaSalidasProps) {
    const [page, setPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState("todos");
    const [envioType, setEnvioType] = useState<"todos" | "sin" | "con" | "minorista">("todos");
    const [localItems, setLocalItems] = useState(initialItems);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SalidaRow>>({});

    const updateSalida = useMutation(api.salidas.mutations.update);

    // Sincronizar con cambios externos
    useEffect(() => {
        setLocalItems(initialItems);
    }, [initialItems]);

    const handleSaveInline = async () => {
        if (!editingId) return;
        const itemToUpdate = localItems.find(p => p.id === editingId);
        if (!itemToUpdate) return;

        try {
            const cleanItem = { ...itemToUpdate, ...editForm };
            // @ts-ignore - Convex IDs and extra fields
            const id = (itemToUpdate as any)._id || itemToUpdate.id;

            await updateSalida({
                id: id as any,
                numeroSalida: cleanItem.numeroSalida,
                bodegaId: (cleanItem as any).bodegaId,
                responsable: cleanItem.responsable,
                fecha: cleanItem.fecha,
                status: cleanItem.status,
                tipo: cleanItem.tipo,
                totalAmount: (cleanItem as any).totalAmount || (cleanItem as any).valor || 0,
                tipoEntrega: (cleanItem as any).tipoEntrega || "Local",
                items: (cleanItem as any).items || [],
                // Campos opcionales
                almacen: (cleanItem as any).almacen,
                agente: (cleanItem as any).agente,
                clienteDireccion: (cleanItem as any).clienteDireccion,
                serie: (cleanItem as any).serie,
                clienteCodigo: (cleanItem as any).clienteCodigo,
                clienteNombre: (cleanItem as any).clienteNombre,
                numeroDocumento: (cleanItem as any).numeroDocumento,
                ruta: (cleanItem as any).ruta,
                destino: (cleanItem as any).destino,
            });

            setEditingId(null);
            setEditForm({});
            addToast({ 
                title: "Salida actualizada", 
                description: "Los cambios se guardaron correctamente.",
                color: "success" 
            });
        } catch (error) {
            addToast({ title: "Error", description: "No se pudo actualizar la salida", color: "danger" });
        }
    };

    const handleCancelInline = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleAvanzarEstado = async (item: SalidaRow) => {
        let nextStatus: string | null = null;
        
        if (item.tipo === "venta") {
            if (item.status === "Creado") {
                nextStatus = "Entregado";
            }
        } else {
            const currentIndex = STATUS_OPTIONS.indexOf(item.status);
            if (currentIndex < STATUS_OPTIONS.length - 1) {
                nextStatus = STATUS_OPTIONS[currentIndex + 1];
            }
        }

        if (nextStatus) {
            try {
                // @ts-ignore
                const id = (item as any)._id || item.id;
                
                await updateSalida({
                    id: id as any,
                    numeroSalida: item.numeroSalida,
                    bodegaId: (item as any).bodegaId,
                    responsable: item.responsable,
                    fecha: item.fecha,
                    status: nextStatus,
                    tipo: item.tipo,
                    totalAmount: (item as any).totalAmount || (item as any).valor || 0,
                    tipoEntrega: (item as any).tipoEntrega || "Local",
                    items: (item as any).items || [],
                    // Campos opcionales
                    almacen: (item as any).almacen,
                    agente: (item as any).agente,
                    clienteDireccion: (item as any).clienteDireccion,
                });

                addToast({
                    title: "Estado actualizado",
                    description: `La salida ${item.numeroSalida} pasó a: ${nextStatus}`,
                    color: "success"
                });
            } catch (error) {
                addToast({ title: "Error", description: "No se pudo actualizar el estado", color: "danger" });
            }
        }
    };

    const filteredItems = useMemo(() => {
        let result = localItems || [];

        if (envioType === "sin") {
            result = result.filter(item => item.status !== "Enviado" && item.status !== "Entregado");
        } else if (envioType === "con") {
            result = result.filter(item => item.status === "Enviado" || item.status === "Entregado");
        } else if (envioType === "minorista") {
            result = result.filter(item => item.tipo === "venta");
        }

        if (activeFilter !== "todos") {
            const filter = FILTERS.find(f => f.key === activeFilter);
            result = result.filter(item => item.status === filter?.label);
        }

        return result;
    }, [localItems, activeFilter, envioType]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        return filteredItems.slice(start, start + ROWS_PER_PAGE);
    }, [filteredItems, page]);

    const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
                <Button
                    color="primary"
                    radius="full"
                    className="h-10 px-6"
                    startContent={<PlusIcon className="size-5 stroke-[3]" />}
                    onPress={onAgregar}
                >
                    Nueva Salida
                </Button>
                <Input
                    placeholder="Buscar salidas, responsables, rutas..."
                    radius="full"
                    classNames={{
                        inputWrapper: "h-10 bg-white border border-default-200 shadow-sm transition-all hover:bg-default-50",
                    }}
                    startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                    className="flex-1"
                />
                <Button isIconOnly variant="bordered" radius="full" className="min-w-10 h-10 border-default-200">
                    <FunnelIcon className="size-5" />
                </Button>
            </div>

            <div className="px-2 flex items-center gap-4">
                <Tabs
                    selectedKey={envioType}
                    onSelectionChange={(k) => setEnvioType(k as any)}
                    color="primary"
                    radius="full"
                    classNames={{
                        cursor: "bg-primary shadow-md",
                        tabList: "bg-default-100 p-1",
                        tab: "h-9 font-bold tracking-wider uppercase text-xs px-6"
                    }}
                >
                    <Tab key="todos" title="Todos" />
                    <Tab key="sin" title="Sin Envío" />
                    <Tab key="con" title="Con Envío" />
                    <Tab key="minorista" title="Minorista" />
                </Tabs>
                <div className="h-6 w-px bg-default-200 ml-2" />
            </div>

            <div className="flex flex-wrap items-center gap-2 px-2 overflow-x-auto no-scrollbar">
                {FILTERS.map((filter) => (
                    <Chip
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        variant={activeFilter === filter.key ? "solid" : "flat"}
                        color={filter.color}
                        className={`cursor-pointer transition-all active:scale-95 px-4 h-9 font-bold ${activeFilter === filter.key ? "shadow-md" : "hover:bg-default-200"
                            } ${filter.customColor && activeFilter === filter.key ? filter.customColor : ""}`}
                        size="md"
                    >
                        {filter.label}
                    </Chip>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table aria-label="Tabla de salidas" shadow="none" removeWrapper className="bg-transparent">
                    <TableHeader>
                        {columns.map((column) => (
                            <TableColumn
                                key={column.key}
                                className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6"
                                align={column.key === "actions" ? "end" : "start"}
                            >
                                {column.label}
                            </TableColumn>
                        ))}
                    </TableHeader>
                    <TableBody items={paginatedRows} emptyContent="No hay registros registrados.">
                        {(item: SalidaRow) => {
                            const isEditing = editingId === item.id;
                            return (
                                <TableRow 
                                    key={(item as any)._id || item.id} 
                                    className={`border-b border-default-50 last:border-0 transition-colors h-14 ${isEditing ? "bg-primary/5" : "hover:bg-default-50/50 cursor-pointer"}`}
                                    onClick={() => onEditar?.(item)}
                                >
                                    <TableCell className="px-6">
                                        <Button
                                            size="sm"
                                            variant="light"
                                            className="font-mono text-primary font-semibold min-w-0 h-auto p-0 hover:underline text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditar?.(item);
                                            }}
                                        >
                                            {item.numeroSalida}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                className="w-full text-sm font-semibold bg-white border border-primary/30 rounded px-2 py-1 outline-none focus:border-primary shadow-sm"
                                                value={editForm.responsable || ""}
                                                onChange={(e) => setEditForm({ ...editForm, responsable: e.target.value })}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="font-semibold text-foreground text-sm cursor-text">{item.responsable}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {isEditing ? (
                                            <input
                                                className="w-full text-sm bg-white border border-primary/30 rounded px-2 py-1 outline-none focus:border-primary shadow-sm"
                                                value={editForm.lugarRuta || ""}
                                                onChange={(e) => setEditForm({ ...editForm, lugarRuta: e.target.value })}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-default-500 text-sm font-normal cursor-text">{item.lugarRuta}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {isEditing ? (
                                            <input
                                                className="w-full text-sm bg-white border border-primary/30 rounded px-2 py-1 outline-none focus:border-primary shadow-sm"
                                                value={editForm.fecha || ""}
                                                onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-default-500 text-sm font-normal cursor-text">{item.fecha}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {isEditing ? (
                                            <select
                                                className="w-full text-xs font-bold uppercase tracking-tighter bg-white border border-primary/30 rounded px-1 py-1 outline-none focus:border-primary shadow-sm"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {(item.tipo === "venta" ? ["Creado", "Entregado"] : STATUS_OPTIONS).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={statusColor(item.status)}
                                                className="font-bold uppercase tracking-tighter text-[10px] h-6"
                                            >
                                                {item.status}
                                            </Chip>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <span className="font-semibold text-foreground text-sm">
                                            <span className="text-default-400 mr-1 text-xs">$</span>
                                            {((item as any).totalAmount || (item as any).valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-end px-6">
                                        <div className="flex items-center justify-end gap-1">
                                            {isEditing ? (
                                                <>
                                                    <Button isIconOnly size="sm" variant="flat" color="success" onPress={handleSaveInline}>
                                                        <CheckIcon className="size-4" />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="flat" color="danger" onPress={handleCancelInline}>
                                                        <XMarkIcon className="size-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {(item.status !== "Entregado") && (item.tipo !== "venta" || item.status === "Creado") && (
                                                        <Tooltip content="Avanzar Estado">
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="flat"
                                                                color="success"
                                                                className="bg-success/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAvanzarEstado(item);
                                                                }}
                                                            >
                                                                <CheckIcon className="size-4" />
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    {canDelete && (
                                                        <Tooltip content="Borrar">
                                                            <Button 
                                                                isIconOnly 
                                                                size="sm" 
                                                                variant="light" 
                                                                color="danger" 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onBorrar?.(item);
                                                                }}
                                                            >
                                                                <TrashIcon className="size-4" />
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        }}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="p-4 flex justify-center border-t border-default-50 bg-default-50/30">
                        <Pagination
                            showControls
                            page={page}
                            total={totalPages}
                            onChange={setPage}
                            classNames={{
                                cursor: "bg-primary font-bold shadow-lg shadow-primary/20",
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
