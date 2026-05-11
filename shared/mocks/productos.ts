/**
 * Mock de productos para desarrollo y pruebas.
 */

export type ProductoRow = {
  id: string;
  sku: string;
  codigo: string;
  producto: string;
  cantidadEmpaque: string;
  categoria: string;
  subcategoria: string;
  status: string;
  lista1: string;
  lista2: string;
  lista3: string;
  lista4: string;
  lista5: string;
  lista6: string;
  lista7: string;
  lista8: string;
  lista9: string;
  lista10: string;
  lista11: string;
  lista12: string;
  lista13: string;
  lista14: string;
  lista15: string;
};

function buildListas(base: number): Record<string, string> {
  return Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [`lista${i + 1}`, `$${(base + i * 0.3).toFixed(2)}`])
  ) as Record<string, string>;
}

const categorias = [
  { cat: "Hogar", sub: "Aceites" },
  { cat: "Hogar", sub: "Limpieza" },
  { cat: "Alimentos", sub: "Lácteos" },
  { cat: "Alimentos", sub: "Granos" },
  { cat: "Bebidas", sub: "Refrescos" },
  { cat: "Bebidas", sub: "Jugos" },
  { cat: "Limpieza", sub: "Detergentes" },
  { cat: "Limpieza", sub: "Desinfectantes" },
  { cat: "Personal", sub: "Higiene" },
  { cat: "Personal", sub: "Cuidado" },
];

const productosNombres = [
  "Aceite 3 En1 Rojo",
  "Detergente Líquido 1L",
  "Leche Entera 1L",
  "Arroz Premium 1kg",
  "Refresco Cola 600ml",
  "Jugo Naranja 1L",
  "Jabón Líquido 500ml",
  "Cloro 1L",
  "Shampoo Anticaspa 400ml",
  "Crema Corporal 250ml",
  "Aceite Vegetal 900ml",
  "Escurridor Platos",
  "Yogurt Natural 1kg",
  "Frijol Negro 1kg",
  "Agua Mineral 1.5L",
  "Jugo Manzana 500ml",
  "Lavavajillas 500ml",
  "Desinfectante 1L",
  "Acondicionador 350ml",
  "Protector Solar 200ml",
  "Vinagre Blanco 1L",
  "Esponja Cocina",
  "Queso Oaxaca 400g",
  "Pasta Spaghetti 400g",
  "Cerveza 355ml",
  "Néctar Durazno 1L",
  "Limpiador Multiusos",
  "Jabón Barra 3pz",
  "Gel Fijador 200ml",
  "Crema Facial 50ml",
];

export const mockProductos: ProductoRow[] = productosNombres.flatMap((nombre, idx) => {
  const { cat, sub } = categorias[idx % categorias.length];
  const base = 1 + (idx % 10) * 0.5;
  const listas = buildListas(base);
  const idBase = idx * 2;
  const listas2 = buildListas(base + 0.2);
  return [
    { id: String(idBase + 1), sku: `A${String(idBase + 1).padStart(4, "0")}`, codigo: String((idBase + 1) * 4).padStart(4, "0"), producto: nombre, cantidadEmpaque: String((idx % 5) + 1), categoria: cat, subcategoria: sub, status: idx % 7 === 0 ? "Inactivo" : "Activo", ...listas } as ProductoRow,
    { id: String(idBase + 2), sku: `B${String(idBase + 2).padStart(4, "0")}`, codigo: String((idBase + 2) * 4).padStart(4, "0"), producto: `${nombre} (promo)`, cantidadEmpaque: "1", categoria: cat, subcategoria: sub, status: "Activo", ...listas2 } as ProductoRow,
  ];
});
