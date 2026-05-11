export type SalidaRow = {
    id: string;
    numeroSalida: string;
    responsable: string;
    lugarRuta: string;
    fecha: string;
    status: "Creado" | "Surtido" | "Revisado" | "Empacado" | "En Tarima" | "Completado" | "Enviado" | "Entregado";
    valor: string | number;
    tipo: "carga" | "venta";
};

export const mockSalidas: SalidaRow[] = [
    {
        id: "1",
        numeroSalida: "1769",
        responsable: "Oscar Andrade",
        lugarRuta: "Manzanillo",
        fecha: "15 Abril 2025",
        status: "Creado",
        valor: 368,
        tipo: "carga",
    },
    {
        id: "2",
        numeroSalida: "1768",
        responsable: "Julian Navarro",
        lugarRuta: "Colima",
        fecha: "14 Abril 2025",
        status: "Surtido",
        valor: 125,
        tipo: "carga",
    },
    {
        id: "3",
        numeroSalida: "1267",
        responsable: "Jose Preciado",
        lugarRuta: "Tepic",
        fecha: "14 Abril 2025",
        status: "Revisado",
        valor: 750,
        tipo: "carga",
    },
    {
        id: "4",
        numeroSalida: "1766",
        responsable: "Salvador Ortega",
        lugarRuta: "La paz",
        fecha: "14 Abril 2025",
        status: "En Tarima",
        valor: 855,
        tipo: "carga",
    },
    {
        id: "5",
        numeroSalida: "1765",
        responsable: "Alberto Reinaga",
        lugarRuta: "Nayarit",
        fecha: "13 Abril 2025",
        status: "Entregado",
        valor: 23565.32,
        tipo: "venta",
    },
    {
        id: "6",
        numeroSalida: "1764",
        responsable: "Cliente General Bodega",
        lugarRuta: "Bodega",
        fecha: "12 Abril 2025",
        status: "Entregado",
        valor: 1560.05,
        tipo: "venta",
    },
    {
        id: "7",
        numeroSalida: "M-101",
        responsable: "Ana Martinez",
        lugarRuta: "Minorista Centro",
        fecha: "16 Abril 2025",
        status: "Creado",
        valor: 850.50,
        tipo: "venta",
    },
    {
        id: "8",
        numeroSalida: "M-102",
        responsable: "Pedro Gomez",
        lugarRuta: "Minorista Norte",
        fecha: "16 Abril 2025",
        status: "Entregado",
        valor: 4200.00,
        tipo: "venta",
    },
];
