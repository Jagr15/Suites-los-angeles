"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Input,
    Button,
    Pagination,
    Tabs,
    Tab,
} from "@heroui/react";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { type RutaCargaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 8;

type RutasCargasTableProps = {
    items: RutaCargaRow[];
};

export function RutasCargasTable({ items }: RutasCargasTableProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            return (
                item.numeroCarga.toLowerCase().includes(search.toLowerCase()) ||
                item.responsable.toLowerCase().includes(search.toLowerCase()) ||
                item.destino.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [items, search]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        return filteredItems.slice(start, start + ROWS_PER_PAGE);
    }, [filteredItems, page]);

    const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);

    const getStatusColor = (status: string) => {
        if (status === "Listo para surtir") return "danger";
        if (status === "Entregado") return "default";
        return "warning";
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
                <Input
                    placeholder="Buscar cargas, responsables, destinos..."
                    radius="full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    classNames={{
                        inputWrapper: "h-10 bg-white border border-default-200 shadow-sm transition-all hover:bg-default-50",
                    }}
                    startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                    className="flex-1"
                    aria-label="Buscar carga"
                />
                <Button isIconOnly variant="bordered" radius="full" className="min-w-10 h-10 border-default-200">
                    <FunnelIcon className="size-5" />
                </Button>
            </div>

            <div className="bg-white rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table aria-label="Tabla de cargas de ruta" shadow="none" removeWrapper className="bg-transparent">
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">No Carga</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Responsable</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Destino</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Fecha</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Estado</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-right px-6">Bultos</TableColumn>
                    </TableHeader>
                    <TableBody items={paginatedRows} emptyContent="No se encontraron cargas.">
                        {(item: RutaCargaRow) => (
                            <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-14">
                                <TableCell className="px-6 font-mono font-bold text-primary text-sm">
                                    {item.numeroCarga}
                                </TableCell>
                                <TableCell className="px-6 font-semibold text-foreground text-sm">
                                    {item.responsable}
                                </TableCell>
                                <TableCell className="px-6 text-default-500 text-sm font-normal">
                                    {item.destino}
                                </TableCell>
                                <TableCell className="px-6 text-default-500 text-sm font-normal">
                                    {item.fecha}
                                </TableCell>
                                <TableCell className="px-6">
                                    <span className={`text-xs font-bold uppercase tracking-wide ${item.status === "Listo para surtir" ? "text-danger" : "text-default-600"}`}>
                                        {item.status}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 text-right font-semibold text-foreground text-sm">
                                    {item.bultos}
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
