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
    Pagination,
    Tooltip,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    UsersIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { mockRutasGastos as mockData } from "@/shared/mocks/rutasGastos";

const ROWS_PER_PAGE = 12;

const columns = [
    { key: "categoria", label: "Categoría" },
    { key: "total", label: "TOTAL" },
    { key: "porcentaje", label: "%" },
    { key: "manzanillo", label: "Manzanillo" },
    { key: "colima", label: "Colima" },
    { key: "nayarit", label: "Nayarit" },
    { key: "laPaz", label: "La Paz" },
    { key: "jalisco", label: "Jalisco" },
    { key: "cdConstitucion", label: "CD Constitución" },
];

export function RutasGastos() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const totalPerRow = (item: any) => {
        return (item.manzanillo || 0) + (item.colima || 0) + (item.nayarit || 0) + 
               (item.laPaz || 0) + (item.jalisco || 0) + (item.cdConstitucion || 0);
    };

    const filteredItems = useMemo(() => {
        return mockData.filter((item) => {
            const matchesSearch = item.categoria.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [search]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * ROWS_PER_PAGE;
        const rows = filteredItems.slice(start, start + ROWS_PER_PAGE);

        if (rows.length > 0) {
            // We append a special "total" item that will be rendered as a total row
            return [
                ...rows,
                {
                    id: "total-row",
                    categoria: "Total General",
                    isTotal: true,
                } as any,
            ];
        }
        return rows;
    }, [filteredItems, page]);

    const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);

    const totals = useMemo(() => {
        return filteredItems.reduce(
            (acc, item) => ({
                manzanillo: acc.manzanillo + (item.manzanillo || 0),
                colima: acc.colima + (item.colima || 0),
                nayarit: acc.nayarit + (item.nayarit || 0),
                laPaz: acc.laPaz + (item.laPaz || 0),
                jalisco: acc.jalisco + (item.jalisco || 0),
                cdConstitucion: acc.cdConstitucion + (item.cdConstitucion || 0),
            }),
            {
                manzanillo: 0,
                colima: 0,
                nayarit: 0,
                laPaz: 0,
                jalisco: 0,
                cdConstitucion: 0,
            }
        );
    }, [filteredItems]);

    const formatCurrency = (value: number) => {
        if (value === 0) return "-";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const renderCellWithPercentage = (value: number, total: number, isTotalRow?: boolean, isGlobalColumn?: boolean) => {
        if (value === 0) return <span className="text-default-300">-</span>;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="flex items-center justify-center gap-2">
                <span className={isTotalRow || isGlobalColumn ? "font-bold text-primary" : "font-semibold"}>
                    {formatCurrency(value)}
                </span>
                {percentage > 0 && !isGlobalColumn && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isTotalRow ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    }`}>
                        {percentage.toFixed(0)}%
                    </span>
                )}
            </div>
        );
    };

    const globalTotal = useMemo(() => {
        return Object.values(totals).reduce((a, b) => a + b, 0);
    }, [totals]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex flex-1 items-center gap-3 w-full">
                    <Input
                        placeholder="Buscar por categoría..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
                        className="max-w-xs"
                        variant="bordered"
                        radius="lg"
                    />
                    <div className="flex items-center gap-2 border border-default-200 rounded-xl px-3 h-10 bg-content1 shadow-sm">
                        <CalendarDaysIcon className="size-5 text-default-400" />
                        <input
                            type="date"
                            className="bg-transparent text-sm focus:outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-default-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-sm focus:outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
                <Button
                    color="secondary"
                    variant="flat"
                    startContent={<UsersIcon className="size-5" />}
                    onPress={() => router.push("/proveedores")}
                    className="shrink-0 font-semibold"
                    radius="lg"
                >
                    Ver Proveedores
                </Button>
            </div>

            {/* Table */}
            <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table
                        aria-label="Tabla de gastos de rutas"
                        shadow="none"
                        removeWrapper
                        className="bg-transparent"
                    >
                        <TableHeader>
                            {columns.map((col) => (
                                <TableColumn
                                    key={col.key}
                                    className={`bg-default-50 text-default-500 font-bold uppercase tracking-wider h-12 text-[10px] ${
                                        col.key === "total" ? "text-primary" : ""
                                    }`}
                                    align={col.key === "categoria" ? "start" : "center"}
                                >
                                    {col.label}
                                </TableColumn>
                            ))}
                        </TableHeader>
                        <TableBody items={paginatedRows} emptyContent="No se encontraron registros.">
                            {(item: any) => (
                                <TableRow
                                    key={item.id}
                                    className={
                                        item.isTotal
                                            ? "bg-primary/10 hover:bg-primary/20 transition-colors h-16 border-t-2 border-primary/20"
                                            : "border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-14"
                                    }
                                >
                                    <TableCell className={item.isTotal ? "font-bold text-primary text-sm uppercase" : "font-bold text-foreground text-sm"}>
                                        {item.categoria}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {item.isTotal ? (
                                            <span className="font-black text-primary text-base">
                                                {formatCurrency(globalTotal)}
                                            </span>
                                        ) : (
                                            <span className="font-black text-primary">
                                                {formatCurrency(totalPerRow(item))}
                                            </span>
                                        )}
                                    </TableCell>

                                    <TableCell className={item.isTotal ? "text-center font-bold text-primary" : "text-center font-medium text-primary bg-primary/5 rounded-lg"}>
                                        {item.isTotal ? "-" : item.porcentaje}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.manzanillo : item.manzanillo;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.colima : item.colima;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.nayarit : item.nayarit;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.laPaz : item.laPaz;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.jalisco : item.jalisco;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        {(() => {
                                            const val = item.isTotal ? totals.cdConstitucion : item.cdConstitucion;
                                            const rowTotal = item.isTotal ? globalTotal : totalPerRow(item);
                                            return renderCellWithPercentage(val, rowTotal, item.isTotal);
                                        })()}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

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
