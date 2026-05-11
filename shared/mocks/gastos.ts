export type GastoCategoria = 
    | "DEPÓSITOS" 
    | "Gasolina Bodega" 
    | "Luz" 
    | "Internet Bodega" 
    | "Internet Ruta" 
    | "Paqueteria" 
    | "Otros Servicios" 
    | "AutoConsumo" 
    | "Mantenimiento Bodega" 
    | "Limpieza de Bodega" 
    | "Limpieza de Vehículos" 
    | "Material de Trabajo" 
    | "Compra de Activo Fijo Contado" 
    | "Compra de Activo Fijo Credito" 
    | "Dividendos" 
    | "Comisiones" 
    | "Uniformes" 
    | "Publicidad";

export type PersonaGrupo = "Casa" | "Bodega" | "Rutas";

export type GastoRow = {
    id: string;
    categoria: GastoCategoria;
    subcategoria: string;
    fecha: string;
    responsable: string;
    grupo: PersonaGrupo;
    monto: number;
    proveedor?: string;
};

export const mockGastos: GastoRow[] = [
    {
        id: "1",
        categoria: "Gasolina Bodega",
        subcategoria: "Gasolina Bodega",
        fecha: "2025-04-15",
        responsable: "Daniel Medina",
        grupo: "Casa",
        monto: 535.60,
    },
    {
        id: "2",
        categoria: "Mantenimiento Bodega",
        subcategoria: "Mantenimiento Bodega",
        fecha: "2025-04-14",
        responsable: "Julian Navarro",
        grupo: "Bodega",
        monto: 1250.00,
    },
];

export const CATEGORIAS_GASTOS: GastoCategoria[] = [
    "DEPÓSITOS",
    "Gasolina Bodega",
    "Luz",
    "Internet Bodega",
    "Internet Ruta",
    "Paqueteria",
    "Otros Servicios",
    "AutoConsumo",
    "Mantenimiento Bodega",
    "Limpieza de Bodega",
    "Limpieza de Vehículos",
    "Material de Trabajo",
    "Compra de Activo Fijo Contado",
    "Compra de Activo Fijo Credito",
    "Dividendos",
    "Comisiones",
    "Uniformes",
    "Publicidad",
];

export const SUBCATEGORIAS_GASTOS: Record<GastoCategoria, string[]> = {
    "DEPÓSITOS": ["Lista de Proveedores", "Capital a Prestamos", "Capital a Creditos", "Otros Depósitos"],
    "Gasolina Bodega": ["Gasolina Bodega"],
    "Luz": ["Luz"],
    "Internet Bodega": ["Internet Bodega"],
    "Internet Ruta": ["Internet Rutas"],
    "Paqueteria": ["Paqueteria"],
    "Otros Servicios": ["Otros Servicios"],
    "AutoConsumo": ["AutoConsumo"],
    "Mantenimiento Bodega": ["Mantenimiento Bodega"],
    "Limpieza de Bodega": ["Limpieza de Bodega"],
    "Limpieza de Vehículos": ["Limpieza de Vehiculos"],
    "Material de Trabajo": ["Material de Trabajo"],
    "Compra de Activo Fijo Contado": ["Compra de Activo Fijo Contado"],
    "Compra de Activo Fijo Credito": ["Compra de Activo Fijo Credito"],
    "Dividendos": ["Dividendos"],
    "Comisiones": ["Comisiones"],
    "Uniformes": ["Uniformes"],
    "Publicidad": ["Publicidad"],
};

export const PERSONAS_POR_GRUPO: Record<PersonaGrupo, string[]> = {
    Casa: ["Miguel Medina", "Daniel Medina", "Miguel Medina Jr"],
    Bodega: ["Salvador Ortega", "Julian Navarro", "Beto Reinaga"],
    Rutas: [
        "Gonzalo Reinaga",
        "Cesar Gomes",
        "Jose Preciado",
        "Gustavo Ruelas",
        "Jesus Campos",
        "Jaime Campos",
    ],
};
