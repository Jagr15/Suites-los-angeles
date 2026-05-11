"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Tooltip,
    Pagination,
    Spinner,
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BodegaIngresoForm } from "./BodegaIngresoForm";

const ROWS_PER_PAGE = 10;

export function BodegaIngresos() {
    const [view, setView] = useState<"list" | "add">("list");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // Convex Data
    const items = useQuery(api.bodega_transactions.queries.listIngresos);

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter((item) =>
            item.responsibleName.toLowerCase().includes(search.toLowerCase()) ||
            item.categoryName.toLowerCase().includes(search.toLowerCase()) ||
            (item.subcategoryName || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        const rows = filteredItems.slice(start, start + ROWS_PER_PAGE);

        if (rows.length > 0) {
            return [
                ...rows,
                {
                    _id: "total-row",
                    responsibleName: "Total Ingresos",
                    isTotal: true,
                } as any,
            ];
        }
        return rows;
    }, [filteredItems, page]);

    const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);

    const totalMonto = useMemo(() => {
        return filteredItems.reduce((acc, item) => acc + (item.amount || 0), 0);
    }, [filteredItems]);

    if (view === "add") {
        return (
            <BodegaIngresoForm
                onSuccess={() => setView("list")}
                onCancel={() => setView("list")}
            />
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header Bar */}
            <div className="flex items-center gap-3">
                <Button
                    color="success"
                    radius="full"
                    className="h-10 px-6 text-white font-bold"
                    startContent={<PlusIcon className="size-5 stroke-[3]" />}
                    onPress={() => setView("add")}
                >
                    Nuevo Ingreso
                </Button>
                <Input
                    placeholder="Buscar categorías, responsables..."
                    radius="full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

            {/* Listing Table */}
            <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table 
                    aria-label="Tabla de ingresos" 
                    shadow="none" 
                    removeWrapper 
                    className="bg-transparent"
                >
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Responsable</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Concepto / Categoría</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Fecha</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-right px-6">Monto</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-right px-6 border-l border-default-100">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody 
                        items={paginatedRows} 
                        emptyContent={items === undefined ? <Spinner color="success" /> : "No se encontraron ingresos."}
                    >
                        {(item: any) => (
                            <TableRow
                                key={item._id}
                                className={
                                    item.isTotal
                                        ? "bg-success/10 hover:bg-success/20 transition-colors h-16 border-t-2 border-success/20"
                                        : "border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-12"
                                }
                            >
                                <TableCell className="px-6">
                                    <div className="flex flex-col">
                                        <span
                                            className={
                                                item.isTotal
                                                    ? "font-bold text-success-700 text-sm uppercase"
                                                    : "font-semibold text-foreground text-sm"
                                            }
                                        >
                                            {item.responsibleName}
                                        </span>
                                        {!item.isTotal && (
                                            <span className="text-[10px] text-default-400 font-medium uppercase tracking-wider">
                                                {item.responsibleGroup || "Ruta"}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6">
                                    {!item.isTotal ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-foreground text-sm tracking-tight">
                                                {item.subcategoryName || item.categoryName}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-success-600 font-bold uppercase tracking-widest">
                                                    {item.categoryName}
                                                </span>
                                                {item.clientName && (
                                                    <>
                                                        <span className="text-[10px] text-default-300">•</span>
                                                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">
                                                            {item.clientName}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-success font-bold opacity-30">—</span>
                                    )}
                                </TableCell>
                                <TableCell
                                    className={
                                        item.isTotal
                                            ? "text-success font-bold opacity-30"
                                            : "text-default-500 text-sm font-normal"
                                    }
                                >
                                    {item.isTotal ? "—" : item.date}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span
                                        className={
                                            item.isTotal
                                                ? "text-lg font-bold text-success-700"
                                                : "text-base font-semibold text-foreground"
                                        }
                                    >
                                        <span
                                            className={
                                                item.isTotal ? "text-success/60 mr-1 text-sm" : "text-default-400 mr-1 text-xs"
                                            }
                                        >
                                            $
                                        </span>
                                        {(item.isTotal ? totalMonto : item.amount).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {!item.isTotal && (
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Ver">
                                                <Button isIconOnly size="sm" variant="light" color="success">
                                                    <EyeIcon className="size-4" />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="Editar">
                                                <Button isIconOnly size="sm" variant="light" color="warning">
                                                    <PencilSquareIcon className="size-4" />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="Borrar">
                                                <Button isIconOnly size="sm" variant="light" color="danger">
                                                    <TrashIcon className="size-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    )}
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
                                cursor: "bg-success font-bold shadow-lg shadow-success/20",
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
