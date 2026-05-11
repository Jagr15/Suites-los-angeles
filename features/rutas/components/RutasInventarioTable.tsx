"use client";

import { useMemo, useState } from "react";
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
    Input,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsRightLeftIcon,
    DocumentTextIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import { type BodegaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 10;

type RutasInventarioTableProps = {
    items: BodegaRow[];
    selectedRuta?: string | null;
};

export function RutasInventarioTable({ items, selectedRuta }: RutasInventarioTableProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const allInventoryItems = useMemo(() => {
        // Si hay una ruta seleccionada, filtramos las cargas de esa ruta
        if (selectedRuta) {
            return items
                .filter(i => i.ruta === selectedRuta)
                .flatMap(i => i.productos || []) as any[];
        }
        // Si no, mostramos todos los productos de todas las cargas (como en BodegaInventory)
        return items.flatMap((i) => i.productos || []) as any[];
    }, [selectedRuta, items]);

    const filteredItems = useMemo(() => {
        if (!search) return allInventoryItems;
        const lowSearch = search.toLowerCase();
        return allInventoryItems.filter(item =>
            item.descripcion.toLowerCase().includes(lowSearch) ||
            item.sku.toLowerCase().includes(lowSearch) ||
            item.id.toString().includes(lowSearch)
        );
    }, [allInventoryItems, search]);

    const paginatedInventory = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        return filteredItems.slice(start, start + ROWS_PER_PAGE);
    }, [filteredItems, page]);

    const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Toolbar Principal */}
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    color="primary"
                    radius="full"
                    className="h-10 px-6 font-bold"
                    startContent={<PlusIcon className="size-5 stroke-[3]" />}
                >
                    Nuevo Movimiento
                </Button>

                <Button
                    variant="flat"
                    color="warning"
                    radius="full"
                    className="h-10 px-6 font-bold text-warning-700 bg-warning-50 hover:bg-warning-100"
                    startContent={<ArrowsRightLeftIcon className="size-5 stroke-[2.5]" />}
                >
                    Ajustar Stock
                </Button>

                <Button
                    variant="flat"
                    color="default"
                    radius="full"
                    className="h-10 px-6 font-bold text-default-600 bg-default-100 hover:bg-default-200"
                    startContent={<DocumentTextIcon className="size-5 stroke-[2.5]" />}
                >
                    Kardex / Historial
                </Button>

                <Input
                    placeholder="Buscar por descripción, SKU..."
                    radius="full"
                    value={search}
                    onValueChange={setSearch}
                    classNames={{
                        inputWrapper: "h-10 bg-white border border-default-200 shadow-sm transition-all hover:bg-default-50",
                        input: "text-sm font-semibold"
                    }}
                    startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                    className="flex-1 min-w-[250px]"
                />

                <Button isIconOnly variant="bordered" radius="full" className="min-w-10 h-10 border-default-200">
                    <FunnelIcon className="size-5" />
                </Button>
            </div>

            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-foreground tracking-tight">
                    {selectedRuta ? `Inventario de Ruta: ${selectedRuta}` : "Inventario General de Rutas"}
                </h2>
            </div>

            <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table aria-label="Tabla de inventario de ruta" shadow="none" removeWrapper className="bg-transparent text-left">
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Cód</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">SKU</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Descripción</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Categoría</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center px-6">Stock</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center px-6">Crítico</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center px-6">Bajo</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center px-6">Óptimo</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center px-6">Etiqueta</TableColumn>
                    </TableHeader>
                    <TableBody items={paginatedInventory} emptyContent="No hay productos en el inventario de esta ruta.">
                        {(prod: any) => (
                            <TableRow key={prod.id + prod.sku} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-14">
                                <TableCell className="px-6 text-xs font-mono text-default-400">{prod.id}</TableCell>
                                <TableCell className="px-6 text-xs font-mono font-bold text-default-500">{prod.sku}</TableCell>
                                <TableCell className="px-6 text-sm font-bold text-default-800 min-w-[200px]">{prod.descripcion}</TableCell>
                                <TableCell className="px-6 text-sm text-default-500 font-medium">
                                    <div className="flex flex-col">
                                        <span>{prod.categoria}</span>
                                        <span className="text-[10px] text-default-400">{prod.subcategoria}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center font-bold text-sm text-foreground">{prod.stock}</TableCell>
                                <TableCell className="px-6 text-center text-sm text-danger-500 font-bold">{"< "}{prod.critico}</TableCell>
                                <TableCell className="px-6 text-center text-sm font-bold text-warning-500">{"< "}{prod.bajo}</TableCell>
                                <TableCell className="px-6 text-center text-sm font-bold text-success-500">{"> "}{prod.optimo}</TableCell>
                                <TableCell className="px-6 text-center">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className="font-bold text-[10px] uppercase h-6"
                                        color={prod.etiqueta === "Rojo" ? "danger" : prod.etiqueta === "Verde" ? "success" : "warning"}
                                    >
                                        {prod.etiqueta}
                                    </Chip>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-default-50 bg-default-50/30">
                    <div className="flex flex-wrap items-center gap-3 text-default-500 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-default-200 rounded-full shadow-sm">
                            <ClockIcon className="size-4 text-primary" />
                            <span className="font-medium text-[10px] uppercase tracking-tight">Último inventario</span>
                            <span className="font-bold text-foreground">15 Mar, 2024</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-default-200 rounded-full shadow-sm">
                            <ArrowsRightLeftIcon className="size-4 text-warning" />
                            <span className="font-medium text-[10px] uppercase tracking-tight">Último ajuste</span>
                            <span className="font-bold text-foreground">Ayer, 10:24 AM</span>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            showControls
                            page={page}
                            total={totalPages}
                            onChange={setPage}
                            classNames={{
                                cursor: "bg-primary font-bold shadow-lg shadow-primary/20",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
