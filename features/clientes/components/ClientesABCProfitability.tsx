"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress } from "@heroui/react";
import { mockClientesABC } from "@/shared/mocks/clientesAnalysis";

const riesgoColors = {
    bajo: "success",
    medio: "warning",
    alto: "danger",
    critico: "danger",
};

export function ClientesABCProfitability() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                        RANKING ABC DE RENTABILIDAD DEL CLIENTE
                    </h3>
                    <span className="text-[9px] text-default-400 mt-1 uppercase font-bold italic">
                        (Ruta 4 [selected illustrative route])
                    </span>
                </div>
                <span className="text-[8px] font-bold text-default-400">cite: 27</span>
            </div>

            <Table 
                aria-label="Ranking ABC Table"
                isHeaderSticky
                removeWrapper
                classNames={{
                    th: "bg-transparent text-[9px] font-black text-default-400 uppercase border-b border-divider py-3",
                    td: "py-3 text-[11px] font-bold text-foreground",
                    tr: "border-b border-divider/50 hover:bg-default-50 transition-colors"
                }}
            >
                <TableHeader>
                    <TableColumn>CLIENTE</TableColumn>
                    <TableColumn align="end">UTILIDAD NETA</TableColumn>
                    <TableColumn align="center">VENTA PROMEDIO</TableColumn>
                    <TableColumn align="center">RIESGO DE COBRO</TableColumn>
                </TableHeader>
                <TableBody>
                    {mockClientesABC.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell>{client.nombre}</TableCell>
                            <TableCell className="text-right">
                                <span className={client.utilidadNeta < 0 ? "text-danger" : ""}>
                                    {client.utilidadNeta.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                                    <Progress 
                                        size="sm" 
                                        color={client.ventaPromedio > 400000 ? "primary" : client.ventaPromedio > 40000 ? "warning" : "danger"} 
                                        value={Math.min(100, (client.ventaPromedio / 601000) * 100)} 
                                        className="h-1.5"
                                    />
                                    <span className="text-[9px] font-black text-default-400 min-w-fit">
                                        {client.ventaPromedio.toLocaleString()}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-center">
                                    <div className={`size-2.5 rounded-full bg-${riesgoColors[client.riesgoCobro as keyof typeof riesgoColors]}-500 shadow-[0_0_8px] shadow-${riesgoColors[client.riesgoCobro as keyof typeof riesgoColors]}-500/50`} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
