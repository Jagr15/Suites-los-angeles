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

type TierResult = {
  tierId: string;
  productId: string;
  action: "created" | "updated" | "existing";
  basePrice: number;
};

type AcapulcoProductSeed = {
  match: string[];
  sku?: string;
  producto: string;
  cantidadEmpaque: string;
  categoriaName: string;
  subcategoriaName: string;
  lista1: string;
  stock: number;
};

type SupplierDoc = {
  _id: Id<"suppliers">;
  businessName: string;
  creditDays: number;
};

function normalize(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
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

async function ensureProductTier(
  ctx: MutationCtx,
  productId: Id<"products">,
  basePrice: number
) {
  const existing = await ctx.db
    .query("pricingProductTiers")
    .withIndex("by_productId_minQty", (q) => q.eq("productId", productId))
    .collect();

  const activeTiers = existing.filter((tier) => tier.active);
  const payload = {
    productId,
    minQty: 1,
    maxQty: undefined,
    basePrice,
    active: true,
    ruleVersion: 1,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    notes: "Seed QA inventario",
  };

  if (activeTiers.length > 0) {
    const primary = activeTiers.find((tier) => tier.minQty === 1 && tier.maxQty === undefined) || activeTiers[0];
    const needsPatch =
      primary.minQty !== 1 ||
      primary.maxQty !== undefined ||
      primary.basePrice !== basePrice ||
      primary.active !== true ||
      primary.notes !== "Seed QA inventario";
    if (needsPatch) {
      await ctx.db.patch(primary._id, payload);
      for (const tier of activeTiers) {
        if (tier._id !== primary._id) {
          await ctx.db.patch(tier._id, { active: false });
        }
      }
      return { id: primary._id, action: "updated" as const };
    }

    for (const tier of existing) {
      if (tier._id !== primary._id && tier.active) {
        await ctx.db.patch(tier._id, { active: false });
      }
    }
    return { id: primary._id, action: "existing" as const };
  }

  const id = await ctx.db.insert("pricingProductTiers", payload);
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

async function ensureQAProductRepairFields(
  ctx: MutationCtx,
  productId: Id<"products">,
  patch: Record<string, unknown>
) {
  if (Object.keys(patch).length === 0) return "existing" as const;
  await ctx.db.patch(productId, patch);
  return "updated" as const;
}

async function recomputeProductStock(ctx: MutationCtx, productId: Id<"products">) {
  const rows = await ctx.db
    .query("inventory")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
  return rows.reduce((acc, row) => acc + (row.quantity || 0), 0);
}

async function ensureSupplier(ctx: MutationCtx) {
  const existing = await ctx.db.query("suppliers").collect();
  const first = existing[0] as SupplierDoc | undefined;
  if (first) {
    return first;
  }

  const id = await ctx.db.insert("suppliers", {
    businessName: "Proveedor QA Inventario",
    name: "QA Inventario",
    rfc: "XAXX010101000",
    creditDays: 30,
    creditLimit: 50000,
    currentBalance: 0,
    contacts: [{ name: "QA", phone: "0000000000", email: "qa@inventario.local" }],
    bankAccounts: [{ bankName: "N/A", accountNumber: "0000000000", clabe: "000000000000000000" }],
  });
  const supplier = await ctx.db.get(id);
  if (!supplier) {
    throw new Error("No se pudo crear el proveedor de QA.");
  }
  return supplier as SupplierDoc;
}

async function ensurePurchaseForBodega(
  ctx: MutationCtx,
  args: {
    bodega: SeedBodega;
    supplierId: Id<"suppliers">;
    folio: string;
    items: Array<{ productId: Id<"products">; quantity: number; unitCost: number }>;
  }
) {
  const existing = await ctx.db
    .query("purchases")
    .withIndex("by_folio", (q) => q.eq("folio", args.folio))
    .unique();

  const totalAmount = args.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const payload = {
    supplierId: args.supplierId,
    bodegaId: args.bodega._id,
    folio: args.folio,
    folioNumber: Number(args.folio.replace(/\D/g, "")) || undefined,
    date: new Date().toISOString().slice(0, 10),
    dueDate: undefined,
    totalAmount,
    remainingAmount: totalAmount,
    stockApplied: false,
    status: "Pendiente" as const,
    receptionStatus: "Completa" as const,
    notes: "Seed QA inventario",
  };

  let purchaseId: Id<"purchases">;
  if (existing) {
    await ctx.db.patch(existing._id, payload);
    purchaseId = existing._id;
  } else {
    purchaseId = await ctx.db.insert("purchases", payload);
  }

  const existingItems = await ctx.db
    .query("purchase_items")
    .withIndex("by_purchaseId", (q) => q.eq("purchaseId", purchaseId))
    .collect();
  for (const item of existingItems) {
    await ctx.db.delete(item._id);
  }

  for (const item of args.items) {
    await ctx.db.insert("purchase_items", {
      purchaseId,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
    });
  }

  return purchaseId;
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
    const supplier = await ensureSupplier(ctx);

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
    const tierResults: TierResult[] = [];
    const inventoryResults: InventoryResult[] = [];

    for (const seed of productSeeds) {
      const categoryId = seed.categoriaName === "Bebidas" ? beverageCategory.id : groceryCategory.id;
      const subcategoryId = subcategoryByName.get(normalize(seed.subcategoriaName));
      if (!subcategoryId) {
        throw new Error(`No se pudo resolver la subcategoría ${seed.subcategoriaName}.`);
      }

      const product = await ensureProduct(ctx, seed, categoryId, subcategoryId);
      const tier = await ensureProductTier(ctx, product.id, parseMoney(seed.lista1));
      tierResults.push({
        tierId: String(tier.id),
        productId: String(product.id),
        action: tier.action,
        basePrice: parseMoney(seed.lista1),
      });
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

    const productBySku = new Map(
      (await ctx.db.query("products").collect()).map((product) => [product.sku, product])
    );

    for (const bodega of targetBodegas) {
      const purchaseItems = [
        { productId: productBySku.get("DEMO-AGUA-600")?._id, quantity: bodega.name === "Bodega Central" ? 100 : bodega.name === "Bodega Norte" ? 80 : 60, unitCost: 5.2 },
        { productId: productBySku.get("DEMO-COLA-355")?._id, quantity: bodega.name === "Bodega Central" ? 100 : bodega.name === "Bodega Norte" ? 80 : 60, unitCost: 6.5 },
        { productId: productBySku.get("DEMO-GALLETA-VANILLA")?._id, quantity: bodega.name === "Bodega Central" ? 100 : bodega.name === "Bodega Norte" ? 80 : 60, unitCost: 7.8 },
        { productId: productBySku.get("DEMO-ARROZ-1KG")?._id, quantity: bodega.name === "Bodega Central" ? 100 : bodega.name === "Bodega Norte" ? 80 : 60, unitCost: 12.4 },
        { productId: productBySku.get("DEMO-ACEITE-1L")?._id, quantity: bodega.name === "Bodega Central" ? 100 : bodega.name === "Bodega Norte" ? 80 : 60, unitCost: 18.9 },
      ].filter((item): item is { productId: Id<"products">; quantity: number; unitCost: number } => Boolean(item.productId));

      await ensurePurchaseForBodega(ctx, {
        bodega,
        supplierId: supplier._id,
        folio: `QA-INV-${normalize(bodega.name).replace(/\s+/g, "-").toUpperCase()}`,
        items: purchaseItems,
      });
    }

    return {
      ok: true,
      bodegas: targetBodegas.map((bodega) => ({
        id: String(bodega._id),
        name: bodega.name,
      })),
      products: productResults,
      pricingTiers: tierResults,
      inventory: inventoryResults,
      note: "Seed idempotente ejecutado sin borrar datos existentes.",
    };
  },
});

export const repairAcapulcoQaPricing = mutation({
  args: {},
  handler: async (ctx) => {
    await assertProdMaintenanceAccess(ctx);

    const qaBodega = (await ctx.db.query("bodegas").collect()).find((bodega) => {
      const label = normalize(`${bodega.name} ${String((bodega as { alias?: string }).alias || "")}`);
      return label.includes("acapulco");
    });
    if (!qaBodega) {
      throw new Error("No se encontró la bodega QA de Acapulco.");
    }

    const beverageCategory = await ensureCategory(ctx, "Bebidas");
    const groceryCategory = await ensureCategory(ctx, "Abarrotes");
    const snackCategory = await ensureCategory(ctx, "Snacks");

    const [aguaSub, refrescosSub, snackSub] = await Promise.all([
      ensureSubcategory(ctx, beverageCategory.id, "Agua"),
      ensureSubcategory(ctx, beverageCategory.id, "Refrescos"),
      ensureSubcategory(ctx, snackCategory.id, "Snacks"),
    ]);

    const qaSeeds: AcapulcoProductSeed[] = [
      {
        match: ["agua qa acapulco 1l", "agua qa acapulco"],
        producto: "Agua QA Acapulco 1L",
        cantidadEmpaque: "1 pieza",
        categoriaName: "Bebidas",
        subcategoriaName: "Agua",
        lista1: "$12.00",
        stock: 100,
      },
      {
        match: ["refresco qa acapulco 600ml", "refresco qa acapulco"],
        producto: "Refresco QA Acapulco 600ML",
        cantidadEmpaque: "1 pieza",
        categoriaName: "Bebidas",
        subcategoriaName: "Refrescos",
        lista1: "$15.00",
        stock: 80,
      },
      {
        match: ["snack qa acapulco"],
        producto: "Snack QA Acapulco",
        cantidadEmpaque: "1 pieza",
        categoriaName: "Snacks",
        subcategoriaName: "Snacks",
        lista1: "$18.00",
        stock: 60,
      },
    ];

    const categoryByName = new Map([
      [normalize("Bebidas"), beverageCategory.id],
      [normalize("Abarrotes"), groceryCategory.id],
      [normalize("Snacks"), snackCategory.id],
    ]);
    const subcategoryByName = new Map([
      [normalize("Agua"), aguaSub.id],
      [normalize("Refrescos"), refrescosSub.id],
      [normalize("Snacks"), snackSub.id],
    ]);

    const products = await ctx.db.query("products").collect();
    const results: Array<{
      productId: string;
      sku?: string;
      action: "updated" | "existing" | "missing";
      tierId?: string;
      tierAction?: "created" | "updated" | "existing";
      stockAction?: "created" | "updated" | "existing";
    }> = [];

    for (const seed of qaSeeds) {
      const product = products.find((item) => {
        const haystack = normalize(`${item.producto} ${item.sku} ${item.codigo}`);
        return seed.match.some((needle) => haystack.includes(normalize(needle)));
      });

      if (!product) {
        results.push({ productId: "missing", sku: seed.producto, action: "missing" });
        continue;
      }

      const categoryId = categoryByName.get(normalize(seed.categoriaName));
      const subcategoryId = subcategoryByName.get(normalize(seed.subcategoriaName));
      const patch: Record<string, unknown> = {};
      if (!product.status || product.status !== "Activo") patch.status = "Activo";
      if (!product.cantidadEmpaque) patch.cantidadEmpaque = seed.cantidadEmpaque;
      if (!product.categoria && categoryId) patch.categoria = String(categoryId);
      if (!product.subcategoria && subcategoryId) patch.subcategoria = String(subcategoryId);
      if (!product.lista1) patch.lista1 = seed.lista1;

      const productAction = await ensureQAProductRepairFields(ctx, product._id, patch);
      const basePrice = parseMoney(product.lista1 || seed.lista1);
      const tier = await ensureProductTier(ctx, product._id, basePrice);
      const stockAction = await ensureInventoryQuantity(ctx, product._id, qaBodega._id, seed.stock);
      const currentStock = await recomputeProductStock(ctx, product._id);
      if (currentStock !== product.stock) {
        await ctx.db.patch(product._id, { stock: currentStock });
      }

      results.push({
        productId: String(product._id),
        sku: product.sku,
        action: productAction,
        tierId: String(tier.id),
        tierAction: tier.action,
        stockAction,
      });
    }

    return {
      ok: true,
      bodegaId: String(qaBodega._id),
      bodegaName: qaBodega.name,
      products: results,
    };
  },
});
