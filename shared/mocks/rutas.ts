/**
 * Mock de rutas para desarrollo y pruebas.
 * tipoEntrega: "sucursal" (entrega a sucursal) | "envio" (envío lejano).
 * Los estados dependen del tipo (sucursal vs envío).
 */

export type RutaRow = {
  id: string;
  ruta: string;
  destino: string;
  responsable: string;
  tipoEntrega: "sucursal" | "envio";
  status: string;
};

export type RutaCargaRow = {
  id: string;
  numeroCarga: string;
  responsable: string;
  destino: string;
  fecha: string;
  status: string;
  bultos: number;
};

const rutas = ["001", "002", "003", "005", "006", "009"];
const destinos = ["Vallarta", "Manzanillo", "La Paz", "Colima", "Tepic", "CP Constitucion"];
const responsables = ["Roberto Martinez", "Luis Miguel Hernandez", "Andw Andrade", "Migel Medina", "Salvador Ortega", "Cesar Vazquez"];
const tipos: ("sucursal" | "envio")[] = ["sucursal", "envio", "sucursal", "envio", "sucursal", "envio"];
const estadosSucursal = ["Listo para surtir", "Listo para checar", "Listo para empacar", "Listo para entregar", "Entregado"];
const estadosEnvio = ["Listo para surtir", "Listo para checar", "Listo para empacar", "Listo para enviar", "En Camino", "Entregado"];

export const mockRutas: RutaRow[] = rutas.map((codigo, idx) => {
  const tipo = tipos[idx % tipos.length];
  const estados = tipo === "sucursal" ? estadosSucursal : estadosEnvio;
  return {
    id: String(idx + 1),
    ruta: codigo,
    destino: destinos[idx % destinos.length],
    responsable: responsables[idx % responsables.length],
    tipoEntrega: tipo,
    status: estados[idx % estados.length],
  };
});

export const mockRutaCargas: RutaCargaRow[] = [
  { id: "1", numeroCarga: "1769", responsable: "Oscar Andrade", destino: "Manzanillo", fecha: "15 Abril 2025", status: "Listo para surtir", bultos: 368 },
  { id: "2", numeroCarga: "1755", responsable: "Oscar Andrade", destino: "Manzanillo", fecha: "8 Abril 2025", status: "Entregado", bultos: 352 },
  { id: "3", numeroCarga: "1740", responsable: "Oscar Andrade", destino: "Manzanillo", fecha: "1 Abril 2025", status: "Entregado", bultos: 385 },
  { id: "4", numeroCarga: "1726", responsable: "Oscar Andrade", destino: "Manzanillo", fecha: "23 Marzo 2025", status: "Entregado", bultos: 298 },
  { id: "5", numeroCarga: "1711", responsable: "Salvador Ortega", destino: "Manzanillo", fecha: "16 Marzo 2025", status: "Entregado", bultos: 344 },
  { id: "6", numeroCarga: "1692", responsable: "Salvador Ortega", destino: "Tepic", fecha: "9 Marzo 2025", status: "Entregado", bultos: 501 },
  { id: "7", numeroCarga: "1678", responsable: "Salvador Ortega", destino: "La Paz", fecha: "2 Marzo 2025", status: "Entregado", bultos: 402 },
  { id: "8", numeroCarga: "1665", responsable: "Julian Navarro", destino: "Colima", fecha: "23 Febrero 2025", status: "Entregado", bultos: 368 },
  { id: "9", numeroCarga: "1650", responsable: "Julian Navarro", destino: "Vallarta", fecha: "16 Febrero 2025", status: "Listo para surtir", bultos: 412 },
  { id: "10", numeroCarga: "1635", responsable: "Alberto Reinaga", destino: "Nayarit", fecha: "9 Febrero 2025", status: "Entregado", bultos: 225 },
  { id: "11", numeroCarga: "1620", responsable: "Alberto Reinaga", destino: "Guadalajara", fecha: "2 Febrero 2025", status: "Entregado", bultos: 184 },
];
