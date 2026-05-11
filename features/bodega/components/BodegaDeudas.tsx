"use client";

import { useState } from "react";
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Avatar,
    AvatarGroup,
    Button,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const suppliers = [
    { name: "Salvador O.", color: "primary" },
    { name: "Julian Navarro", color: "secondary" },
    { name: "Alberto Reinaga", color: "warning" },
];

const MOCK_DATA: Record<string, any> = {
    "Salvador O.": {
        debtStats: [
            { label: "Deuda Total", value: 15000, color: "text-danger" },
            { label: "Nomina 16 de Julio", value: 3500, color: "text-warning" },
            { label: "Próximo abono", value: 1000, color: "text-primary" },
            { label: "Deuda desp del abono", value: 14000, color: "text-success" },
        ],
        transactions: [
            { id: "1", type: "Abono", date: "10 Febrero 2026", entity: "Bodega", amount: 1000, sign: "+" },
            { id: "2", type: "Pago", date: "10 Febrero 2026", entity: "Bodega", amount: 2500, sign: "-" },
            { id: "3", type: "Abono", date: "3 Febrero 2026", entity: "Bodega", amount: 1000, sign: "+" },
            { id: "4", type: "Pago", date: "3 Febrero 2026", entity: "Bodega", amount: 2500, sign: "-" },
            { id: "5", type: "Prestamo", date: "2 Febrero 2026", entity: "Daniel M.", amount: 17000, sign: "-" },
        ]
    },
    "Julian Navarro": {
        debtStats: [
            { label: "Deuda Total", value: 8400, color: "text-danger" },
            { label: "Nomina 16 de Julio", value: 1200, color: "text-warning" },
            { label: "Próximo abono", value: 400, color: "text-primary" },
            { label: "Deuda desp del abono", value: 8000, color: "text-success" },
        ],
        transactions: [
            { id: "1", type: "Abono", date: "11 Febrero 2026", entity: "Bodega", amount: 400, sign: "+" },
            { id: "2", type: "Pago", date: "11 Febrero 2026", entity: "Bodega", amount: 800, sign: "-" },
            { id: "3", type: "Prestamo", date: "1 Febrero 2026", entity: "Bodega", amount: 10000, sign: "-" },
        ]
    },
    "Alberto Reinaga": {
        debtStats: [
            { label: "Deuda Total", value: 32000, color: "text-danger" },
            { label: "Nomina 16 de Julio", value: 4500, color: "text-warning" },
            { label: "Próximo abono", value: 1500, color: "text-primary" },
            { label: "Deuda desp del abono", value: 30500, color: "text-success" },
        ],
        transactions: [
            { id: "1", type: "Abono", date: "15 Febrero 2026", entity: "Bodega", amount: 1500, sign: "+" },
            { id: "2", type: "Pago", date: "14 Febrero 2026", entity: "Bodega", amount: 3000, sign: "-" },
            { id: "3", type: "Prestamo", date: "10 Enero 2026", entity: "Admin", amount: 45000, sign: "-" },
        ]
    }
};

export type BodegaDeudasProps = {
    onBack?: () => void;
    empleado?: string;
};

export function BodegaDeudas({ onBack, empleado }: BodegaDeudasProps) {
    const [selectedSupplier, setSelectedSupplier] = useState(empleado || suppliers[0].name);

    const currentData = MOCK_DATA[selectedSupplier] || MOCK_DATA[suppliers[0].name];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Suppliers Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button isIconOnly variant="flat" size="sm" radius="full" onPress={onBack}>
                                <ArrowLeftIcon className="size-4" />
                            </Button>
                        )}
                        <AvatarGroup isBordered max={3} size="sm">
                            {suppliers.map((s) => (
                                <Avatar key={s.name} name={s.name} />
                            ))}
                        </AvatarGroup>
                        <div className="flex gap-2">
                            {suppliers.map((s) => (
                                <Chip 
                                    key={s.name} 
                                    variant={selectedSupplier === s.name ? "solid" : "flat"}
                                    color={s.color as any} 
                                    size="sm" 
                                    className="font-semibold uppercase tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedSupplier(s.name)}
                                >
                                    {s.name}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Debt Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentData.debtStats.map((stat: any) => (
                        <Card key={stat.label} shadow="none" className="border border-default-100 bg-content1 rounded-2xl">
                            <CardBody className="flex flex-col gap-1 p-4">
                                <span className="text-[10px] font-bold text-default-400 uppercase tracking-widest">
                                    {stat.label}
                                </span>
                                <span className={`text-xl font-semibold ${stat.color}`}>
                                    {formatCurrency(stat.value)}
                                </span>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
                <Table aria-label="Tabla de deudas y pagos" shadow="none" removeWrapper className="bg-transparent">
                    <TableHeader>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Tipo</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs">Fecha</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-center">Entidad / Responsable</TableColumn>
                        <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs text-right">Monto</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentData.transactions.map((item: any) => (
                            <TableRow key={item.id} className="border-b border-default-50 last:border-0 h-12 hover:bg-default-50/50 transition-colors">
                                <TableCell>
                                    {item.type && (
                                        <Chip
                                            variant="flat"
                                            color={item.type === "Abono" ? "primary" : item.type === "Pago" ? "danger" : "warning"}
                                            size="sm"
                                            className="font-bold uppercase tracking-tighter"
                                        >
                                            {item.type}
                                        </Chip>
                                    )}
                                </TableCell>
                                <TableCell className="text-default-500 text-sm font-normal">{item.date}</TableCell>
                                <TableCell className="text-center font-medium text-foreground text-sm">{item.entity}</TableCell>
                                <TableCell className="text-right">
                                    {item.amount > 0 && (
                                        <span className={`text-base font-semibold ${item.sign === "+" ? "text-primary" : "text-danger"}`}>
                                            {item.sign} {formatCurrency(item.amount)}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
