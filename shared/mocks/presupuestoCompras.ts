import type { CompraProducto } from "./compras";

export type PresupuestoCompraRow = {
    id: string;
    proveedor: string;
    monto: number;
    fecha?: string;
    productos?: CompraProducto[];
};

export const mockPresupuestoCompras: PresupuestoCompraRow[] = [
    { 
        id: "1", 
        proveedor: "MDMX", 
        monto: 33568.56,
        fecha: "Martes 25 de Marzo",
        productos: [
            { id: "1535", sku: "AMSOOM", descripcion: "Advil Mayo 500 Mg", categoria: "Farmacia", subcategoria: "Analgésico", cantidad: 100, costo: 41.36, total: 4136, stockAnterior: 125, stockNuevo: 225 },
            { id: "1024", sku: "PAR500", descripcion: "Paracetamol 500mg", categoria: "Farmacia", subcategoria: "Analgésico", stock: 200, precio: 15.00, cantidad: 50, costo: 15, total: 750, stockAnterior: 200, stockNuevo: 250 } as any
        ]
    },
    { id: "2", proveedor: "Huygos", monto: 6837.60, fecha: "Miércoles 26 de Marzo", productos: [] },
    { id: "3", proveedor: "Dimuflo", monto: 15183.30, fecha: "Jueves 27 de Marzo", productos: [] },
    { id: "4", proveedor: "Papelería", monto: 1583.67, fecha: "Viernes 28 de Marzo", productos: [] },
    { id: "5", proveedor: "Mercería", monto: 5845.50, fecha: "Sábado 29 de Marzo", productos: [] },
    { id: "6", proveedor: "Pameyo", monto: 7065.83, fecha: "Lunes 31 de Marzo", productos: [] },
    { id: "7", proveedor: "PG", monto: 35589.03, fecha: "Martes 01 de Abril", productos: [] },
    { id: "8", proveedor: "Farmacia Guadalajara", monto: 9893.30, fecha: "Miércoles 02 de Abril", productos: [] },
    { id: "9", proveedor: "Regalos Areli", monto: 3785.60, fecha: "Jueves 03 de Abril", productos: [] },
];
