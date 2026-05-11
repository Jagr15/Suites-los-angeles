export interface ClienteABC {
    id: string;
    nombre: string;
    utilidadNeta: number;
    ventaPromedio: number;
    riesgoCobro: 'bajo' | 'medio' | 'alto' | 'critico';
}

export const mockClientesABC: ClienteABC[] = [
    { id: '1', nombre: 'Top 10 Client 1', utilidadNeta: 273300, ventaPromedio: 601000, riesgoCobro: 'bajo' },
    { id: '2', nombre: 'Top 10 Client 2', utilidadNeta: 135000, ventaPromedio: 412000, riesgoCobro: 'bajo' },
    { id: '3', nombre: 'Cliente Ruta 3', utilidadNeta: 83000, ventaPromedio: 61000, riesgoCobro: 'bajo' },
    { id: '4', nombre: 'Cliente Ruta 4', utilidadNeta: 48000, ventaPromedio: 45000, riesgoCobro: 'medio' },
    { id: '5', nombre: 'Cliente Ruta 5', utilidadNeta: 35000, ventaPromedio: 53000, riesgoCobro: 'medio' },
    { id: '6', nombre: 'Cliente Ruta 6', utilidadNeta: 21000, ventaPromedio: 18000, riesgoCobro: 'alto' },
    { id: '7', nombre: 'Cliente Ruta 7', utilidadNeta: 18000, ventaPromedio: 15000, riesgoCobro: 'alto' },
    { id: '8', nombre: 'Cliente Ruta 8', utilidadNeta: 13000, ventaPromedio: 11000, riesgoCobro: 'critico' },
    { id: '9', nombre: 'Cliente Top 9', utilidadNeta: 35000, ventaPromedio: -5200, riesgoCobro: 'critico' },
    { id: '10', nombre: 'Cliente Top 10', utilidadNeta: -17000, ventaPromedio: 15300, riesgoCobro: 'critico' },
];

export const mockHeatmapData = [
    { name: 'Ruta 1', data: [70, 85, 90, 65] },
    { name: 'Ruta 2', data: [60, 75, 80, 55] },
    { name: 'Ruta 3', data: [80, 90, 95, 75] },
    { name: 'Ruta 4', data: [40, 50, 45, 35] },
    { name: 'Ruta 5', data: [30, 40, 35, 25] },
    { name: 'Ruta 6', data: [90, 95, 100, 85] },
    { name: 'Ruta 7', data: [50, 60, 55, 45] },
    { name: 'Ruta 8', data: [20, 30, 25, 15] },
];

export const mockScatterData = [
    { name: 'Clientes', data: Array.from({ length: 40 }, () => [Math.floor(Math.random() * 200), Math.floor(Math.random() * 500)]) }
];
