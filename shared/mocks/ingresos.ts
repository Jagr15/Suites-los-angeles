export type IngresoCategoria = 
    | "Ingreso x Venta" 
    | "Pago de Cliente" 
    | "Otros Ingresos" 
    | "Inyeccion de Capital";

export type PersonaGrupo = "Casa" | "Bodega" | "Rutas";

export type IngresoRow = {
    id: string;
    categoria: IngresoCategoria;
    subcategoria: string;
    fecha: string;
    responsable: string;
    grupo: PersonaGrupo;
    monto: number;
    cliente?: string;
};

export const mockIngresos: IngresoRow[] = [
    {
        id: "1",
        categoria: "Ingreso x Venta",
        subcategoria: "Venta Contado",
        fecha: "2025-04-15",
        responsable: "Daniel Medina",
        grupo: "Casa",
        monto: 15600.00,
    },
    {
        id: "2",
        categoria: "Pago de Cliente",
        subcategoria: "Pago Factura",
        fecha: "2025-04-14",
        responsable: "Salvador Ortega",
        grupo: "Bodega",
        monto: 5000.00,
        cliente: "Pomeco",
    },
];

export const CATEGORIAS_INGRESOS: IngresoCategoria[] = [
    "Ingreso x Venta",
    "Pago de Cliente",
    "Otros Ingresos",
    "Inyeccion de Capital",
];

export const SUBCATEGORIAS_INGRESOS: Record<IngresoCategoria, string[]> = {
    "Ingreso x Venta": ["Venta Contado", "Venta Credito"],
    "Pago de Cliente": ["Pago Factura", "Abono", "Lista de Clientes"],
    "Otros Ingresos": ["Otros Ingresos"],
    "Inyeccion de Capital": ["Inyeccion de Capital"],
};
