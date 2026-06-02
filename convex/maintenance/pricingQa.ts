import { mutation } from "../_generated/server";
import { isAdmin } from "../common/utils";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type SeedBodega = {
  _id: Id<"bodegas">;
  name: string;
};

type ProductSeed = {
  sku: string;
  codigo: string;
  producto: string;
  cantidadEmpaque: string;
  categoriaName: string;
  subcategoriaName: string;
  lista1: string;
};

type InventoryResult = {
  productId: string;
  productSku: string;
  bodegaId: string;
  quantity: number;
  action: "created" | "updated" | "existing";
};

type ProductResult = {
  productId: string;
  sku: string;
  action: "created" | "updated" | "existing";
  stock: number;
};

function normalize(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function assertProdMaintenanceAccess(ctx: MutationCtx) {
  if (await isAdmin(ctx)) return;
  const allowProd = (process.env.ALLOW_PROD_MAINTENANCE || "").trim().toLowerCase() === "true";
  if (allowProd) return;
  throw new Error("Acceso denegado: requiere admin o mantenimiento productivo habilitado por entorno.");
}

async function ensureCategory(ctx: MutationCtx, name: string) {
  const existing = await ctx.db
    .query("product_categories")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();

  if (existing) {
    return { id: existing._id, created: false };
  }

  const id = await ctx.db.insert("product_categories", { name });
  return { id, created: true };
}

async function ensureSubcategory(ctx: MutationCtx, categoryId: Id<"product_categories">, name: string) {
  const existing = await ctx.db
    .query("product_subcategories")
    .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
    .collect();
  const match = existing.find((item) => normalize(item.name) === normalize(name));
  if (match) {
    return { id: match._id, created: false };
  }

  const id = await ctx.db.insert("product_subcategories", {
    name,
    categoryId,
  });
  return { id, created: true };
}

async function ensureProduct(
  ctx: MutationCtx,
  input: ProductSeed,
  categoryId: Id<"product_categories">,
  subcategoryId: Id<"product_subcategories">
) {
  const existing = await ctx.db
    .query("products")
    .withIndex("by_sku", (q) => q.eq("sku", input.sku))
    .first();

  const payload = {
    sku: input.sku,
    codigo: input.codigo,
    producto: input.producto,
    cantidadEmpaque: input.cantidadEmpaque,
    categoria: String(categoryId),
    subcategoria: String(subcategoryId),
    status: "Activo" as const,
    lista1: input.lista1,
    stock: 0,
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return { id: existing._id, action: "updated" as const };
  }

  const id = await ctx.db.insert("products", payload);
  return { id, action: "created" as const };
}

async function ensureInventoryQuantity(
  ctx: MutationCtx,
  productId: Id<"products">,
  bodegaId: Id<"bodegas">,
  quantity: number
) {
  const existing = await ctx.db
    .query("inventory")
    .withIndex("by_product_bodega", (q) =>
      q.eq("productId", productId).eq("bodegaId", bodegaId)
    )
    .unique();

  if (existing) {
    if (existing.quantity !== quantity) {
      await ctx.db.patch(existing._id, { quantity });
      return "updated" as const;
    }
    return "existing" as const;
  }

  await ctx.db.insert("inventory", {
    productId,
    bodegaId,
    quantity,
  });
  return "created" as const;
}

async function recomputeProductStock(ctx: MutationCtx, productId: Id<"products">) {
  const rows = await ctx.db
    .query("inventory")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
  return rows.reduce((acc, row) => acc + (row.quantity || 0), 0);
}

function selectBodegas(bodegas: SeedBodega[]) {
  const exactNames = ["Bodega Central", "Bodega Norte", "Bodega Sur"];
  const byName = new Map(bodegas.map((bodega) => [normalize(bodega.name), bodega]));
  const exactMatches = exactNames.map((name) => byName.get(normalize(name))).filter(Boolean) as SeedBodega[];

  if (exactMatches.length === 3) {
    return exactMatches;
  }

  const ordered = [...bodegas].sort((a, b) => a.name.localeCompare(b.name));
  if (ordered.length < 3) {
    throw new Error("Se requieren al menos 3 bodegas para ejecutar este seed.");
  }

  return ordered.slice(0, 3);
}

export const seedInventoryForPricingQA = mutation({
  args: {},
  handler: async (ctx) => {
    await assertProdMaintenanceAccess(ctx);

    const bodegas = await ctx.db.query("bodegas").collect();
    const targetBodegas = selectBodegas(
      bodegas.map((bodega) => ({ _id: bodega._id, name: bodega.name }))
    );

    const beverageCategory = await ensureCategory(ctx, "Bebidas");
    const groceryCategory = await ensureCategory(ctx, "Abarrotes");

    const [refrescosSub, galletasSub, granosSub, aceitesSub] = await Promise.all([
      ensureSubcategory(ctx, beverageCategory.id, "Refrescos y Agua"),
      ensureSubcategory(ctx, groceryCategory.id, "Galletas"),
      ensureSubcategory(ctx, groceryCategory.id, "Granos y Cereales"),
      ensureSubcategory(ctx, groceryCategory.id, "Aceites y Cocina"),
    ]);

    const productSeeds: ProductSeed[] = [
      {
        sku: "DEMO-AGUA-600",
        codigo: "DEMO-AGUA-600",
        producto: "Agua 600ml",
        cantidadEmpaque: "1 pieza",
        categoriaName: "Bebidas",
        subcategoriaName: "Refrescos y Agua",
        lista1: "$12.00",
      },
      {
        sku: "DEMO-COLA-355",
        codigo: "DEMO-COLA-355",
        producto: "Refresco Cola 355ml",
        cantidadEmpaque: "1 lata",
        categoriaName: "Bebidas",
        subcategoriaName: "Refrescos y Agua",
        lista1: "$15.00",
      },
      {
        sku: "DEMO-GALLETA-VANILLA",
        codigo: "DEMO-GALLETA-VANILLA",
        producto: "Galleta Vainilla",
        cantidadEmpaque: "1 paquete",
        categoriaName: "Abarrotes",
        subcategoriaName: "Galletas",
        lista1: "$18.00",
      },
      {
        sku: "DEMO-ARROZ-1KG",
        codigo: "DEMO-ARROZ-1KG",
        producto: "Arroz 1kg",
        cantidadEmpaque: "1 kg",
        categoriaName: "Abarrotes",
        subcategoriaName: "Granos y Cereales",
        lista1: "$28.00",
      },
      {
        sku: "DEMO-ACEITE-1L",
        codigo: "DEMO-ACEITE-1L",
        producto: "Aceite 1L",
        cantidadEmpaque: "1 litro",
        categoriaName: "Abarrotes",
        subcategoriaName: "Aceites y Cocina",
        lista1: "$35.00",
      },
    ];

    const subcategoryByName = new Map<string, Id<"product_subcategories">>([
      [normalize("Refrescos y Agua"), refrescosSub.id],
      [normalize("Galletas"), galletasSub.id],
      [normalize("Granos y Cereales"), granosSub.id],
      [normalize("Aceites y Cocina"), aceitesSub.id],
    ]);

    const productResults: ProductResult[] = [];
    const inventoryResults: InventoryResult[] = [];

    for (const seed of productSeeds) {
      const categoryId = seed.categoriaName === "Bebidas" ? beverageCategory.id : groceryCategory.id;
      const subcategoryId = subcategoryByName.get(normalize(seed.subcategoriaName));
      if (!subcategoryId) {
        throw new Error(`No se pudo resolver la subcategoría ${seed.subcategoriaName}.`);
      }

      const product = await ensureProduct(ctx, seed, categoryId, subcategoryId);
      const quantitiesByBodega = new Map<Id<"bodegas">, number>([
        [targetBodegas[0]._id, 100],
        [targetBodegas[1]._id, 80],
        [targetBodegas[2]._id, 60],
      ]);

      for (const [bodegaId, quantity] of quantitiesByBodega) {
        const action = await ensureInventoryQuantity(ctx, product.id, bodegaId, quantity);
        inventoryResults.push({
          productId: String(product.id),
          productSku: seed.sku,
          bodegaId: String(bodegaId),
          quantity,
          action,
        });
      }

      const stock = await recomputeProductStock(ctx, product.id);
      await ctx.db.patch(product.id, { stock });

      productResults.push({
        productId: String(product.id),
        sku: seed.sku,
        action: product.action,
        stock,
      });
    }

    return {
      ok: true,
      bodegas: targetBodegas.map((bodega) => ({
        id: String(bodega._id),
        name: bodega.name,
      })),
      products: productResults,
      inventory: inventoryResults,
      note: "Seed idempotente ejecutado sin borrar datos existentes.",
    };
  },
});
