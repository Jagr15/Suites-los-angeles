import { type BodegaProducto } from "../schemas/bodega";

/**
 * Mock de bodega (rutas) para desarrollo y pruebas.
 * tipoEntrega: "sucursal" (entrega en sucursal) | "pedido" (envío lejano).
 */

export type BodegaRow = {
  _id?: string;
  id: string;
  numeroCarga: string;
  folio?: string; // Para consistencia con compras
  fecha: string;
  serie: string;
  status: string;
  receptionStatus?: "Completa" | "Faltante" | "Pendiente";
  proveedor?: string; // Para entradas
  recepcion?: "Completa" | "Faltante"; // Para entradas
  monto?: string; // Para entradas
  clienteCodigo: string;
  clienteNombre: string;
  clienteDireccion: string;
  almacen: string;
  agente: string;
  numeroDocumento: string;
  // Campos anteriores (se mantienen por compatibilidad)
  codigo: string;
  ruta: string;
  destino: string;
  responsable: string;
  tipoEntrega: "sucursal" | "pedido";
  productos: BodegaProducto[];
  items?: Array<Record<string, unknown>>;
};

const rutas = ["001", "002", "003", "005", "006", "009"];
const destinos = ["Manzanillo", "Colima", "Guadalajara", "Tepic", "Puerto Vallarta", "Mazatlán"];
const responsables = ["Julian Navarro", "María López", "Carlos Ruiz", "Ana García", "Pedro Sánchez", "Laura Martínez"];
export const ALMACENES_MOCK = ["Almacén Central", "Sucursal Norte", "Bodega Poniente"];
const agentes = ["Agente 01", "Agente 02", "Agente 03"];
const clientes = [
  { cod: "CL-001", nom: "Comercializadora X", dir: "Av. Principal 123" },
  { cod: "CL-002", nom: "Tiendas del Sur", dir: "Calle Secundaria 456" },
  { cod: "CL-003", nom: "Distribuidora Nacional", dir: "Blvd. Industrial 789" },
];

const PRODUCT_POOL = [
  // Farmacia
  { desc: "Paracetamol 500mg", price: 15.0, cat: "Farmacia", sub: "Analgésico", crit: 20, low: 40, opt: 100, tag: "Verde" },
  { desc: "Ibuprofeno 400mg", price: 22.5, cat: "Farmacia", sub: "Antiinflamatorio", crit: 15, low: 35, opt: 80, tag: "Azul" },
  { desc: "Amoxicilina 500mg", price: 45.0, cat: "Farmacia", sub: "Antibiótico", crit: 10, low: 25, opt: 50, tag: "Rojo" },
  { desc: "Vitamina C 1g", price: 85.0, cat: "Farmacia", sub: "Suplemento", crit: 12, low: 30, opt: 75, tag: "Naranja" },
  { desc: "Alcohol Etílico 500ml", price: 32.0, cat: "Farmacia", sub: "Antiséptico", crit: 25, low: 60, opt: 150, tag: "Blanco" },

  // Abarrotes
  { desc: "Aceite Vegetal 1L", price: 38.0, cat: "Abarrotes", sub: "Aceites", crit: 30, low: 80, opt: 200, tag: "Amarillo" },
  { desc: "Arroz Extra 1kg", price: 24.5, cat: "Abarrotes", sub: "Granos", crit: 50, low: 120, opt: 300, tag: "Blanco" },
  { desc: "Frijol Negro 1kg", price: 35.0, cat: "Abarrotes", sub: "Legumbres", crit: 40, low: 100, opt: 250, tag: "Negro" },
  { desc: "Azúcar Refinada 1kg", price: 28.0, cat: "Abarrotes", sub: "Endulzantes", crit: 35, low: 90, opt: 200, tag: "Blanco" },
  { desc: "Sal de Mesa 1kg", price: 12.5, cat: "Abarrotes", sub: "Condimentos", crit: 20, low: 50, opt: 150, tag: "Gris" },
  { desc: "Atún en Agua 140g", price: 19.5, cat: "Abarrotes", sub: "Enlatados", crit: 48, low: 144, opt: 360, tag: "Azul" },
  { desc: "Pasta Spaghetti 200g", price: 9.5, cat: "Abarrotes", sub: "Pastas", crit: 60, low: 180, opt: 480, tag: "Rojo" },

  // Limpieza e Higiene
  { desc: "Detergente Polvo 1kg", price: 42.0, cat: "Limpieza", sub: "Lavandería", crit: 20, low: 50, opt: 120, tag: "Verde" },
  { desc: "Jabón de Tocador", price: 14.5, cat: "Higiene", sub: "Cuidado Personal", crit: 30, low: 90, opt: 240, tag: "Celeste" },
  { desc: "Pasta Dental 100ml", price: 34.0, cat: "Higiene", sub: "Dental", crit: 15, low: 45, opt: 120, tag: "Blanco" },
  { desc: "Papel Higiénico 4 rollos", price: 28.5, cat: "Limpieza", sub: "Papel", crit: 40, low: 120, opt: 300, tag: "Naranja" },
  { desc: "Limpiador Multiusos 1L", price: 21.0, cat: "Limpieza", sub: "Líquidos", crit: 15, low: 40, opt: 100, tag: "Amarillo" },

  // Bebidas y Lácteos
  { desc: "Leche Entera 1L", price: 26.0, cat: "Lácteos", sub: "Leches", crit: 24, low: 72, opt: 200, tag: "Azul" },
  { desc: "Yogurt Natural 1kg", price: 48.0, cat: "Lácteos", sub: "Yogurts", crit: 10, low: 25, opt: 60, tag: "Rosa" },
  { desc: "Agua Purificada 1.5L", price: 15.0, cat: "Bebidas", sub: "Aguas", crit: 36, low: 108, opt: 300, tag: "Transparente" },
  { desc: "Refresco de Cola 600ml", price: 18.0, cat: "Bebidas", sub: "Refrescos", crit: 48, low: 144, opt: 400, tag: "Rojo" },
];

export const mockBodega: BodegaRow[] = rutas.map((ruta, idx) => {
  const tipo = (idx % 2 === 0 ? "sucursal" : "pedido") as "sucursal" | "pedido";
  const date = new Date();
  date.setDate(date.getDate() - idx);
  const cliente = clientes[idx % clientes.length];

  return {
    id: String(idx + 1),
    numeroCarga: `CG-${1000 + idx}`,
    folio: String(2500 + idx),
    fecha: date.toLocaleDateString("es-ES"),
    serie: "A",
    status: (["Pendiente", "Revisado", "Completado", "Revisar"] as const)[idx % 4],
    proveedor: ["Dimuflo", "MDMX", "Huggos", "Pamego"][idx % 4],
    recepcion: (idx % 3 === 0 ? "Faltante" : "Completa") as "Completa" | "Faltante",
    monto: (15000 + idx * 2500).toLocaleString("en-US", { minimumFractionDigits: 2 }),
    clienteCodigo: cliente.cod,
    clienteNombre: cliente.nom,
    clienteDireccion: cliente.dir,
    almacen: ALMACENES_MOCK[idx % ALMACENES_MOCK.length],
    agente: agentes[idx % agentes.length],
    numeroDocumento: `DOC-${5000 + idx}`,
    // Compatibilidad
    codigo: `CG-${2024001 + idx}`,
    ruta,
    destino: destinos[idx % destinos.length],
    responsable: responsables[idx % responsables.length],
    tipoEntrega: tipo,
    productos: Array.from({ length: 12 }).map((_, pIdx) => {
      // Usar un offset fijo basado en idx para que no se repitan entre cargas consecutivas
      const poolIdx = (idx * 4 + pIdx) % PRODUCT_POOL.length;
      const p = PRODUCT_POOL[poolIdx];
      const isOut = pIdx === 3; // El cuarto producto siempre será sin stock para pruebas

      return {
        id: `${idx * 100 + pIdx + 1}`,
        sku: `SKU-${3000 + idx * 10 + pIdx}`,
        descripcion: p.desc,
        stock: isOut ? 0 : 50 + idx + pIdx,
        sinStock: isOut,
        cantidad: 3 + pIdx,
        precio: p.price,
        categoria: p.cat,
        subcategoria: p.sub,
        critico: p.crit,
        bajo: p.low,
        optimo: p.opt,
        etiqueta: p.tag,
      };
    }),
  };
});

