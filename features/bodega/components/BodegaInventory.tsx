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
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import type { BodegaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 10;

type BodegaInventoryProps = {
    items: BodegaRow[];
    selectedCarga: BodegaRow | null;
    onClearSelection: () => void;
    onNuevo?: () => void;
    onAjustar?: () => void;
};

export function BodegaInventory({ items, selectedCarga, onClearSelection, onNuevo, onAjustar }: BodegaInventoryProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const allInventoryItems = useMemo(() => {
        // Buscar la carga actualizada en la lista de items para evitar datos viejos
        const currentCarga = selectedCarga ? items.find((i) => i.id === selectedCarga.id) : null;
        return currentCarga ? (currentCarga.productos as any[]) : (items.flatMap((i) => i.productos) as any[]);
    }, [selectedCarga, items]);

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
            {/* Toolbar Principal - Estilo igual a Salidas */}
            <div className="flex flex-wrap items-center gap-3">


                {/* solo admin */}


                <Button
                    color="primary"
                    radius="full"
                    className="h-10 px-6"
                    startContent={<PlusIcon className="size-5 stroke-[3]" />}
                    onPress={onNuevo}
                >
                    Nuevo Inventario
                </Button>

                <Button
                    variant="flat"
                    color="warning"
                    radius="full"
                    className="h-10 px-6 font-bold text-warning-700 bg-warning-50 hover:bg-warning-100"
                    startContent={<ArrowsRightLeftIcon className="size-5 stroke-[2.5]" />}
                    onPress={onAjustar}
                >
                    Ajustar Inventario
                </Button>

                <Button
                    variant="flat"
                    color="default"
                    radius="full"
                    className="h-10 px-6 font-bold text-default-600 bg-default-100 hover:bg-default-200"
                    startContent={<DocumentTextIcon className="size-5 stroke-[2.5]" />}
                >
                    Registro de Inventario
                </Button>

                {/* Input Search */}
                <Input
                    placeholder="Buscar por descripción, SKU o ID..."
                    radius="full"
                    value={search}
                    onValueChange={setSearch}
                    classNames={{
                        inputWrapper: "h-10 bg-white border border-default-200 shadow-sm transition-all hover:bg-default-50",
                    }}
                    startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                    className="flex-1 min-w-[300px]"
                />

                <Button isIconOnly variant="bordered" radius="full" className="min-w-10 h-10 border-default-200">
                    <FunnelIcon className="size-5" />
                </Button>
            </div>

            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-foreground tracking-tight">
                    {selectedCarga ? `Productos de Carga: ${selectedCarga.numeroCarga}` : "Total Inventario en Cargas"}
                </h2>
                {selectedCarga && (
                    <Button
                        variant="light"
                        color="primary"
                        onPress={onClearSelection}
                        className="font-bold underline-offset-4 hover:underline"
                    >
                        Ver todos los productos
                    </Button>
                )}
            </div>
            <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table aria-label="Tabla de inventario" shadow="none" removeWrapper className="bg-transparent">
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Cód</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">SKU</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Descripción</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Categoría</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Subcategoría</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Stock</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Crítico</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Bajo</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Óptimo</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Etiqueta</TableColumn>
                    </TableHeader>
                    <TableBody items={paginatedInventory} emptyContent="No hay productos para mostrar.">
                        {(prod: any) => (
                            <TableRow key={`${prod.id}-${prod.sku}-${Math.random()}`} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-12">
                                <TableCell className="text-xs font-mono text-default-400">{prod.id}</TableCell>
                                <TableCell className="text-xs font-mono font-bold text-default-500">{prod.sku}</TableCell>
                                <TableCell className="text-sm font-medium text-default-700 min-w-[200px]">{prod.descripcion}</TableCell>
                                <TableCell className="text-sm text-foreground">{prod.categoria}</TableCell>
                                <TableCell className="text-sm text-default-500">{prod.subcategoria}</TableCell>
                                <TableCell className="text-center font-bold text-sm">{prod.stock}</TableCell>
                                <TableCell className="text-center text-sm text-danger-500 font-medium">{"< "}{prod.critico}</TableCell>
                                <TableCell className="text-center text-sm text-warning-500 font-medium">{"< "}{prod.bajo}</TableCell>
                                <TableCell className="text-center text-sm text-success-500 font-medium">{"< "}{prod.optimo}</TableCell>
                                <TableCell className="text-center">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className="font-bold text-[10px] uppercase"
                                        color={prod.etiqueta === "Rojo" ? "danger" : prod.etiqueta === "Verde" ? "success" : prod.etiqueta === "Naranja" || prod.etiqueta === "Amarillo" ? "warning" : "primary"}
                                    >
                                        {prod.etiqueta}
                                    </Chip>
                                </TableCell>
                            </TableRow>
                        )}
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
