export type NominaRow = {
    id: string;
    empleado: string;
    fecha: string;
    monto: number;
    abonoStatus: "Abonar" | "Sin abono" | "Abono Registrado";
    entregaStatus: "Entregar" | "Entregado";
};

export const mockNominas: NominaRow[] = [
    {
        id: "1",
        empleado: "Salvador Ortega",
        fecha: "16 de Julio",
        monto: 3500,
        abonoStatus: "Abonar",
        entregaStatus: "Entregar",
    },
    {
        id: "2",
        empleado: "Julian Navarro",
        fecha: "16 de Julio",
        monto: 2900,
        abonoStatus: "Sin abono",
        entregaStatus: "Entregado",
    },
    {
        id: "3",
        empleado: "Alberto Reinaga",
        fecha: "17 de Julio",
        monto: 2500,
        abonoStatus: "Abono Registrado",
        entregaStatus: "Entregado",
    },
];
